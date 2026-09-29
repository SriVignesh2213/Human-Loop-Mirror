import json
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import UsageSession, Notification
from backend.app.models.habit import HabitLoop
from backend.app.models.insight import Insight
from backend.app.models.reflection import Reflection
from backend.app.models.goal import Goal
from backend.app.models.swap import PersonalSwapSuggestion, PersonalSwapCompletion
from backend.app.schemas.common import ApiResponse

router = APIRouter()


@router.get("/report")
def export_user_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports full user usage telemetry, habit loops, reflections, and insights as a JSON report"""
    sessions = db.query(UsageSession).filter(UsageSession.user_id == current_user.id).all()
    habit_loops = db.query(HabitLoop).filter(HabitLoop.user_id == current_user.id).all()
    insights = db.query(Insight).filter(Insight.user_id == current_user.id).all()
    reflections = db.query(Reflection).filter(Reflection.user_id == current_user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    swaps = db.query(PersonalSwapSuggestion).filter(PersonalSwapSuggestion.user_id == current_user.id).all()

    report = {
        "export_metadata": {
            "application": "Habit Loop Mirror",
            "version": "1.0.0",
            "user_id": str(current_user.id),
            "email": current_user.email,
            "export_timestamp": str(current_user.created_at)
        },
        "profile": {
            "display_name": current_user.profile.display_name if current_user.profile else "",
            "goal_lens": current_user.profile.goal_lens if current_user.profile else "",
            "timezone": current_user.profile.timezone if current_user.profile else ""
        },
        "sessions": [
            {
                "app_name": s.app_name,
                "start_time": s.start_time.isoformat(),
                "end_time": s.end_time.isoformat(),
                "duration_minutes": s.duration_minutes,
                "notification_associated": s.notification_associated,
                "reflection_label": s.reflection_label
            }
            for s in sessions
        ],
        "habit_loops": [
            {
                "app_name": h.app_name,
                "trigger": h.trigger_description,
                "action": h.action_description,
                "time_window": f"{h.time_window_start}-{h.time_window_end}",
                "occurrences": h.occurrences_count,
                "average_duration_minutes": h.average_duration_minutes,
                "confidence": h.confidence
            }
            for h in habit_loops
        ],
        "insights": [
            {
                "title": i.title,
                "observation": i.observation,
                "evidence": json.loads(i.evidence or "[]"),
                "why_it_matters": i.why_it_matters,
                "recommendation": i.recommendation
            }
            for i in insights
        ],
        "reflections": [
            {
                "intentionality_label": r.intentionality_label,
                "notes": r.notes,
                "created_at": r.created_at.isoformat()
            }
            for r in reflections
        ],
        "goals": [
            {
                "title": g.title,
                "target_metric": g.target_metric,
                "target_value": g.target_value,
                "unit": g.unit,
                "status": g.status
            }
            for g in goals
        ],
        "personal_swaps": [
            {
                "title": sw.title,
                "category": sw.category,
                "duration_minutes": sw.duration_minutes,
                "status": sw.status
            }
            for sw in swaps
        ]
    }

    return JSONResponse(
        content=report,
        headers={"Content-Disposition": "attachment; filename=habit_loop_mirror_report.json"}
    )


@router.get("/csv")
def export_user_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exports user usage sessions and reflections in standard CSV format for Excel/Sheets"""
    import io
    import csv
    from fastapi.responses import Response

    sessions = db.query(UsageSession).filter(
        UsageSession.user_id == current_user.id
    ).order_by(UsageSession.start_time.asc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "timestamp",
        "end_time",
        "duration_minutes",
        "app_name",
        "category",
        "notification_associated",
        "notification_title",
        "user_reflection"
    ])

    from backend.app.models.usage import Application
    apps_map = {a.name.lower(): a.category for a in db.query(Application).all()}

    for s in sessions:
        notif_title = s.associated_notification.title if s.associated_notification else ""
        writer.writerow([
            s.start_time.isoformat(),
            s.end_time.isoformat(),
            round(s.duration_minutes, 1),
            s.app_name,
            apps_map.get(s.app_name.lower(), "General"),
            "true" if s.notification_associated else "false",
            notif_title,
            s.reflection_label or ""
        ])

    csv_content = output.getvalue()
    filename = f"habit_mirror_sessions_{datetime.now().strftime('%Y%m%d')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/pdf")
def export_user_pdf(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and downloads a clinical/behavioral PDF telemetry report"""
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from fastapi.responses import Response
    from backend.app.models.usage import Application
    from backend.app.analytics.engine import calculate_dashboard_metrics

    sessions = db.query(UsageSession).filter(UsageSession.user_id == current_user.id).order_by(UsageSession.start_time.asc()).all()
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).all()
    habit_loops = db.query(HabitLoop).filter(HabitLoop.user_id == current_user.id).all()
    insights = db.query(Insight).filter(Insight.user_id == current_user.id).all()
    reflections = db.query(Reflection).filter(Reflection.user_id == current_user.id).all()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    apps_map = {a.name.lower(): a.category for a in db.query(Application).all()}

    session_dicts = [
        {"app_name": s.app_name, "start_time": s.start_time, "duration_minutes": s.duration_minutes, "notification_associated": s.notification_associated}
        for s in sessions
    ]
    notif_dicts = [{"app_name": n.app_name, "timestamp": n.timestamp} for n in notifications]
    loop_dicts = [{"app_name": h.app_name, "occurrences_count": h.occurrences_count} for h in habit_loops]
    metrics = calculate_dashboard_metrics(session_dicts, notif_dicts, loop_dicts)

    profile = current_user.profile
    display_name = profile.display_name if profile and profile.display_name else "User"
    goal_lens = profile.goal_lens if profile and profile.goal_lens else "Focus / Study"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=16, fontName='Helvetica-Bold', textColor=colors.HexColor('#0F172A'), spaceAfter=4)
    subtitle_style = ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontSize=8.5, fontName='Helvetica', textColor=colors.HexColor('#64748B'), spaceAfter=10)
    h2_style = ParagraphStyle('SectionH2', parent=styles['Heading2'], fontSize=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#0F172A'), spaceBefore=10, spaceAfter=4)
    body_style = ParagraphStyle('DocBody', parent=styles['Normal'], fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#334155'), leading=11)

    elements = []

    # Title & Metadata
    elements.append(Paragraph("HABIT LOOP MIRROR — BEHAVIORAL TELEMETRY REPORT", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M UTC')} | Subject: <b>{display_name}</b> ({current_user.email}) | Focus Lens: <b>{goal_lens}</b>", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0D9488'), spaceAfter=10))

    # KPI Summary Table
    elements.append(Paragraph("1. Executive Telemetry Baseline", h2_style))
    kpi_data = [
        ["Total Screen Time", "Daily Average", "Peak Window", "Notification Triggers", "Habit Loops"],
        [
            metrics.get("total_screen_time_formatted", "0m"),
            f"{round(metrics.get('average_daily_screen_time_minutes', 0)/60, 1)}h/day",
            metrics.get("peak_usage_period", "None"),
            f"{metrics.get('notification_triggered_sessions', 0)} sessions",
            f"{len(habit_loops)} detected"
        ]
    ]
    t_kpi = Table(kpi_data, colWidths=[108, 108, 110, 110, 104])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,1), (-1,1), colors.HexColor('#0F766E')),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,1), (-1,1), 9.5),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 8))

    from collections import defaultdict

    app_stats = defaultdict(lambda: {"total_minutes": 0.0, "session_count": 0, "category": "General"})
    total_screen_time = 0.0
    for s in sessions:
        dur = s.duration_minutes
        total_screen_time += dur
        app_name = s.app_name
        cat = apps_map.get(app_name.lower(), "General")
        app_stats[app_name]["total_minutes"] += dur
        app_stats[app_name]["session_count"] += 1
        app_stats[app_name]["category"] = cat

    tracked_apps = []
    for app_name, stat in sorted(app_stats.items(), key=lambda x: x[1]["total_minutes"], reverse=True):
        pct = round((stat["total_minutes"] / total_screen_time * 100.0), 1) if total_screen_time > 0 else 0.0
        tracked_apps.append({
            "app_name": app_name,
            "category": stat["category"],
            "total_minutes": round(stat["total_minutes"], 1),
            "session_count": stat["session_count"],
            "percentage": pct
        })

    # Application Tracking Breakdown
    elements.append(Paragraph("2. Application Usage & Categorization", h2_style))
    if tracked_apps:
        app_table_data = [["Application", "Category", "Recorded Duration", "% of Total", "Sessions"]]
        for app in tracked_apps[:8]:
            app_table_data.append([
                app["app_name"],
                app["category"],
                f"{app['total_minutes']} mins",
                f"{app['percentage']}%",
                str(app["session_count"])
            ])
        t_apps = Table(app_table_data, colWidths=[130, 110, 110, 95, 95])
        t_apps.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('FONTSIZE', (0,1), (-1,-1), 7.5),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_apps)
    else:
        elements.append(Paragraph("<i>No application usage sessions recorded.</i>", body_style))
    elements.append(Spacer(1, 8))

    # Habit Loops
    elements.append(Paragraph("3. Detected Habit Loops (Stimulus -> Response Pattern)", h2_style))
    if habit_loops:
        loops_data = [["App", "Trigger Cue", "Observed Action", "Window", "Occurrences", "Avg Mins", "Confidence"]]
        for hl in habit_loops:
            loops_data.append([
                hl.app_name,
                Paragraph(hl.trigger_description, body_style),
                Paragraph(hl.action_description, body_style),
                f"{hl.time_window_start}-{hl.time_window_end}",
                str(hl.occurrences_count),
                f"{round(hl.average_duration_minutes, 1)}m",
                hl.confidence.capitalize()
            ])
        t_loops = Table(loops_data, colWidths=[65, 120, 125, 70, 55, 50, 55])
        t_loops.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0D9488')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0FDFA')]),
            ('FONTSIZE', (0,1), (-1,-1), 7.5),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_loops)
    else:
        elements.append(Paragraph("<i>No habit loops detected in current telemetry window.</i>", body_style))
    elements.append(Spacer(1, 8))

    # Reflections & Goals
    elements.append(Paragraph("4. Intentionality & Boundary Goals", h2_style))
    refl_summary = {}
    for r in reflections:
        refl_summary[r.intentionality_label] = refl_summary.get(r.intentionality_label, 0) + 1
    total_refl = len(reflections)
    refl_txt = f"Total Intentionality Reflections Logged: <b>{total_refl}</b>"
    if total_refl > 0:
        details = ", ".join([f"{k}: {v} ({round(v/total_refl*100, 1)}%)" for k, v in refl_summary.items()])
        refl_txt += f" — Breakdown: {details}"
    elements.append(Paragraph(refl_txt, body_style))
    elements.append(Spacer(1, 4))

    if goals:
        goals_data = [["Goal Title", "Lens", "Target Threshold", "Observed Baseline", "Status"]]
        for g in goals:
            goals_data.append([
                g.title,
                g.goal_lens,
                f"{g.target_value} {g.unit}",
                f"{g.current_value} {g.unit}" if g.current_value is not None else "Analyzing",
                g.status.capitalize()
            ])
        t_goals = Table(goals_data, colWidths=[160, 110, 100, 95, 75])
        t_goals.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('FONTSIZE', (0,1), (-1,-1), 7.5),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_goals)
    elements.append(Spacer(1, 8))

    # AI Behavioral Insights
    if insights:
        elements.append(Paragraph("5. AI Explainable Behavioral Insights", h2_style))
        for ins in insights:
            elements.append(Paragraph(f"<b>• {ins.title}</b> ({ins.confidence.capitalize()} Confidence)", ParagraphStyle('InsH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#0F172A'))))
            elements.append(Paragraph(f"<i>Observation:</i> {ins.observation}", body_style))
            elements.append(Paragraph(f"<i>Why It Matters:</i> {ins.why_it_matters}", body_style))
            elements.append(Paragraph(f"<i>Compassionate Recommendation:</i> {ins.recommendation}", body_style))
            elements.append(Spacer(1, 4))

    # Confidentiality Note
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
    elements.append(Paragraph("Confidential Telemetry Audit • Generated by Habit Loop Mirror • Awareness precedes intentional change.", ParagraphStyle('Foot', parent=body_style, fontSize=7, textColor=colors.HexColor('#94A3B8'), alignment=1)))

    doc.build(elements)
    pdf_bytes = buf.getvalue()
    filename = f"habit_mirror_report_{datetime.now().strftime('%Y%m%d')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.delete("/clear-usage", response_model=ApiResponse[dict])
def clear_user_usage_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clears all imported usage sessions, notifications, habit loops, reflections, goals, and insights for the user"""
    from backend.app.models.reflection import Reflection
    from backend.app.models.goal import Goal
    from backend.app.models.swap import PersonalSwapSuggestion, PersonalSwapCompletion
    from backend.app.models.analysis import AnalysisRun
    from backend.app.models.habit import HabitLoopEvidence

    # Delete reflections & goals
    db.query(Reflection).filter(Reflection.user_id == current_user.id).delete()
    db.query(Goal).filter(Goal.user_id == current_user.id).delete()
    db.query(PersonalSwapCompletion).filter(
        PersonalSwapCompletion.suggestion_id.in_(
            db.query(PersonalSwapSuggestion.id).filter(PersonalSwapSuggestion.user_id == current_user.id)
        )
    ).delete(synchronize_session=False)
    db.query(PersonalSwapSuggestion).filter(PersonalSwapSuggestion.user_id == current_user.id).delete()
    db.query(AnalysisRun).filter(AnalysisRun.user_id == current_user.id).delete()

    # Delete habit loop evidence and loops
    db.query(HabitLoopEvidence).filter(
        HabitLoopEvidence.habit_loop_id.in_(
            db.query(HabitLoop.id).filter(HabitLoop.user_id == current_user.id)
        )
    ).delete(synchronize_session=False)
    db.query(HabitLoop).filter(HabitLoop.user_id == current_user.id).delete()

    # Delete sessions, notifications, insights
    db.query(UsageSession).filter(UsageSession.user_id == current_user.id).delete()
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.query(Insight).filter(Insight.user_id == current_user.id).delete()
    db.commit()

    return ApiResponse(
        success=True,
        data={"cleared": True},
        message="All imported usage sessions, notifications, reflections, and goals have been cleared."
    )


@router.delete("/account", response_model=ApiResponse[dict])
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Deletes user account and all cascading data from the local database"""
    db.delete(current_user)
    db.commit()

    return ApiResponse(
        success=True,
        data={"deleted": True},
        message="Account and all associated records deleted."
    )

