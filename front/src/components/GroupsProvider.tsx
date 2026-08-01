"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getGroups, type Group } from "@/lib/groups-client";

type GroupsStatus = "idle" | "loading" | "loaded" | "error";

type GroupsContextValue = {
  groups: Group[];
  status: GroupsStatus;
  error?: string;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  removeGroup: (groupId: string) => void;
};

const GroupsContext = createContext<GroupsContextValue | null>(null);

export function GroupsProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [status, setStatus] = useState<GroupsStatus>(enabled ? "loading" : "idle");
  const [error, setError] = useState<string>();
  const requestStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled || requestStartedRef.current) return;

    requestStartedRef.current = true;

    void getGroups()
      .then((loadedGroups) => {
        setGroups(loadedGroups);
        setStatus("loaded");
        setError(undefined);
      })
      .catch(() => {
        setStatus("error");
        setError("Не удалось загрузить группы.");
      });
  }, [enabled]);

  const addGroup = useCallback((group: Group) => {
    setGroups((currentGroups) =>
      currentGroups.some((currentGroup) => currentGroup.id === group.id)
        ? currentGroups
        : [...currentGroups, group]
    );
    setStatus("loaded");
    setError(undefined);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupId));
    setStatus("loaded");
    setError(undefined);
  }, []);

  const updateGroup = useCallback((group: Group) => {
    setGroups((currentGroups) =>
      currentGroups.map((currentGroup) => currentGroup.id === group.id ? group : currentGroup)
    );
    setStatus("loaded");
    setError(undefined);
  }, []);

  const value = useMemo(
    () => ({ groups, status, error, addGroup, updateGroup, removeGroup }),
    [groups, status, error, addGroup, updateGroup, removeGroup]
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups(): GroupsContextValue {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error("useGroups должен использоваться внутри GroupsProvider.");
  }

  return context;
}
