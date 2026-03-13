import React from "react";
import { useAppState, useAppDispatch } from "../store";
import { Plus } from "./Icons";
import EpicCard from "./EpicCard";
import type { Epic } from "../types";

interface Props {
  hideDone?: boolean;
}

export default function BoardView({ hideDone = false }: Props): React.ReactElement {
  const { epics } = useAppState();
  const dispatch = useAppDispatch();

  const sortedEpics = [...epics].sort((a, b) => a.order - b.order);

  const addEpic = () => {
    const maxOrder = epics.length > 0 ? Math.max(...epics.map((e) => e.order)) + 1 : 0;
    const newEpic: Epic = {
      id: `epic-${Date.now()}`,
      title: "New epic – describe the why",
      order: maxOrder,
    };
    dispatch({ type: "ADD_EPIC", epic: newEpic });
  };

  return (
    <div>
      {sortedEpics.map((epic) => (
        <EpicCard key={epic.id} epic={epic} hideDone={hideDone} />
      ))}
      <button className="add-epic-btn" onClick={addEpic}>
        <Plus /> Add Epic
      </button>
    </div>
  );
}
