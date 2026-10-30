import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { defaultNotificationPreference, NOTIFICATION_SETTINGS_GROUPS } from "./notification-settings-schema";

test("notification settings include every database event exactly once", () => {
  const schema = readFileSync(new URL("../../../../../prisma/parts/enums.prisma", import.meta.url), "utf8");
  const enumBody = schema.match(/enum NotificationType\s*\{([^}]+)\}/)?.[1];
  assert.ok(enumBody);
  const databaseTypes = enumBody.trim().split(/\s+/);
  const configured = NOTIFICATION_SETTINGS_GROUPS.flatMap((group) => group.events.map((event) => event.type));
  assert.equal(new Set(configured).size, configured.length);
  assert.deepEqual([...configured].sort(), databaseTypes.sort());
});

test("all requested apps have separate event-level settings", () => {
  for (const app of ["connect", "notes", "pulse", "flow", "atlas", "cadence", "hrms", "control"]) {
    const group = NOTIFICATION_SETTINGS_GROUPS.find(({ id }) => id === app);
    assert.ok(group);
    assert.ok(group.events.length >= 3);
    assert.ok(group.events.every((event) => event.label && event.description));
  }
});

test("unimplemented automatic emitters are not presented as active integrations", () => {
  const active = NOTIFICATION_SETTINGS_GROUPS.flatMap((group) => group.events)
    .filter((event) => event.automaticDelivery)
    .map((event) => event.type);
  assert.deepEqual(
    active.sort(),
    [
      "CALL",
      "DIRECT_MESSAGE",
      "MENTION",
      "NOTES_SHARED",
      "NOTES_ACCESS_REQUEST",
      "NOTES_ACCESS_DECISION",
      "PULSE_INVITATION",
      "PULSE_EVENT_UPDATE",
      "FLOW_ASSIGNMENT",
      "ATLAS_COMMENT",
      "CADENCE_INVITATION",
      "CADENCE_RESULTS",
      "HRMS_LEAVE_REQUEST",
      "HRMS_LEAVE_DECISION",
      "HRMS_PAYROLL",
      "CONTROL_MEMBERSHIP",
      "CONTROL_ROLE_CHANGE",
      "CONTROL_SETTINGS_CHANGE",
    ].sort(),
  );
});

test("defaults preserve existing channel behavior and keep missed-call email off", () => {
  for (const event of NOTIFICATION_SETTINGS_GROUPS.flatMap((group) => group.events)) {
    assert.deepEqual(defaultNotificationPreference(event.type), {
      type: event.type,
      inApp: true,
      email: event.type !== "CALL",
      push: false,
    });
  }
});
