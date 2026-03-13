import React, { useState } from "react";
import { useAppDispatch, useAppState } from "../store";
import type { TeamMember, UnavailableRange } from "../types";
import { TEAM_MEMBERS, MEMBER_COLORS } from "../types";
import { Trash } from "./Icons";

export default function UnavailabilityPanel(): React.ReactElement {
  const { unavailable } = useAppState();
  const dispatch = useAppDispatch();

  const [member, setMember] = useState<TeamMember>("Gaurav");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const add = () => {
    if (!startDate || !endDate) return;
    const entry: UnavailableRange = {
      id: `unavail-${Date.now()}`,
      member,
      startDate,
      endDate,
      reason: reason || undefined,
    };
    dispatch({ type: "ADD_UNAVAILABLE", entry });
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const sorted = [...unavailable].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="unavail-panel">
      <h3>🗓 Team Availability</h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>
        Add time-off or unavailable periods. These are factored into the Gantt schedule.
      </p>

      <div className="unavail-form">
        <div className="form-group">
          <label>Member</label>
          <select value={member} onChange={(e) => setMember(e.target.value as TeamMember)}>
            {TEAM_MEMBERS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Reason (optional)</label>
          <input
            type="text"
            placeholder="e.g. Vacation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button className="btn btn-primary btn-sm" onClick={add} disabled={!startDate || !endDate}>
          Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-light)", padding: 8 }}>
          No unavailability entries yet. Everyone is available!
        </div>
      ) : (
        <div className="unavail-list">
          {sorted.map((u) => (
            <div className="unavail-item" key={u.id}>
              <div>
                <strong style={{ color: MEMBER_COLORS[u.member] }}>{u.member}</strong>
                <span className="dates">
                  {u.startDate} → {u.endDate}
                </span>
                {u.reason && (
                  <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>({u.reason})</span>
                )}
              </div>
              <button
                className="icon-btn danger"
                onClick={() => dispatch({ type: "DELETE_UNAVAILABLE", id: u.id })}
              >
                <Trash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
