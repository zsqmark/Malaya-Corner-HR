# Authorized Time Clock Terminal & Device Gating

Implement dedicated device authorization for employee timeclock operations. Restrict shift clock-in and clock-out actions strictly to designated in-store terminal hardware (e.g. restaurant POS tablets, counter kiosks) authorized via manager security PIN, while providing frontline staff with a clear read-only punch history and shift monitor on their personal devices.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following requirements were confirmed during the interactive clarification interview:
> - **Device Authorization**: Managers authorize a hardware device directly on-site by entering their manager security PIN (`123456` or custom manager PIN).
> - **Personal Device Experience**: Staff accessing "Clock In/Out" on their personal smartphones or non-terminal devices see their personal punch history, current shift status, and a clear prompt directing them to the store terminal.
> - **Kiosk Lifecycle & Auto-Lock**: After an employee successfully punches in or out at the terminal, the terminal displays an immediate confirmation card with a **10-second countdown timer** before automatically locking back to the PIN keypad for the next employee.

---

### 1. Overview & Core Concept

* **The Problem**: Allowing staff to clock in from personal smartphones introduces buddy punching, off-site clock-ins before reaching the floor, and unverified work hours.
* **The Solution**:
  1. **Terminal Authorization Layer**: A device-level authorization token stored in local browser state and registered in Firestore/audit logs. Only authorized devices can render active clock-in/out punch controls.
  2. **Dedicated Terminal Kiosk View**: On authorized devices, the interface offers a high-contrast touch keypad, employee avatar selector, 4–6 digit PIN verification, active shift punch controls, and a 10-second automatic return-to-lock timer.
  3. **Personal Device View**: Frontline team members logging in from home or personal phones can review their weekly roster, availability, tasks, onboarding files, and punch history, but cannot punch in or out off-site.

---

### 2. User Experience & Visual Design

#### A. Key User Flows

```
[Personal / Unauthorized Device]
  Staff opens "Clock In/Out"
    └──> Shows "In-Store Terminal Enforced" Banner
    └──> Real-time shift status badge (e.g., "Active shift started at 11:15 AM on Terminal #1")
    └──> Read-only Punch Log (Date, Shift, In/Out, Total Hours, Status)
    └──> Manager affordance: "Authorize This Device as In-Store Terminal" button

[Manager Device Authorization Flow]
  Manager clicks "Authorize This Device"
    └──> Opens Manager PIN Authorization Modal
    └──> Manager enters 6-digit PIN and optional terminal nickname (e.g. "Sunnybank POS #1")
    └──> Device marked as Authorized Terminal (persisted in browser storage & audit log)
    └──> Immediate transition to Terminal Kiosk Mode

[Staff Terminal Punch Flow]
  Terminal displays Locked Keypad / Employee Picker
    └──> Staff selects their name or enters 4-6 digit employee PIN
    └──> Terminal unlocks to their personalized punch desk
    └──> Staff taps "Clock In", "Start Break", "End Break", or "Clock Out"
    └──> Success screen appears: "Clocked in at 11:30 AM · Wait Staff"
    └──> 10-second visual countdown begins with "Lock Now" skip button
    └──> Auto-locks back to Terminal Keypad ready for the next team member
```

#### B. Visual Hierarchy & Theme

* **Aesthetic Direction**: Utensil-clean, restaurant-industrial workstation matching Malaya Corner branding. High-contrast typography, warm saffron accents (`#F1B434`), crisp dark slate foundations (`#0F172A`).
* **Kiosk Terminal Mode**:
  * Large, thumb-friendly numeric keypad buttons ($64\text{px}\times 64\text{px}$) with tactile active states.
  * Prominent digital clock displaying live restaurant local time (`font-mono tabular-nums text-4xl`).
  * Big, unambiguous punch action buttons (Emerald for "Clock In", Amber for "Take Break", Rose for "Clock Out").
* **Personal Device Notice**:
  * Unboxed informational banner with shield icon: *"In-Store Terminal Clock-In Active"*.
  * Clean explanation: *"To maintain verified shift records, clock in and out must be performed on an authorized store terminal."*
  * High-density tabular layout for past punch records with tabular figures (`font-mono tabular-nums`).

---

### 3. Key Product Decisions & Trade-Offs

* **Decision 1: Device-Level Token vs. Strict Geolocation IP Whitelist**
  * *Chosen Approach*: Device-level cryptographic terminal token stored in persistent local browser storage, protected by manager PIN authorization and logged in audit trails.
  * *Why*: Geolocation APIs frequently fail inside commercial shopping centers/food courts (like Sunnybank Plaza) due to poor indoor GPS reception, and mobile carriers dynamically reassign IPs. Device authorization provides 100% reliable enforcement without location permission prompts or GPS drift failures.
  * *Alternative Considered*: IP address restriction was rejected because commercial cellular hot-spots and dynamic restaurant NBN connections change IPs frequently.

* **Decision 2: Seamless Switching for Managers**
  * *Chosen Approach*: Managers viewing the Clock page on any device can authorize or de-authorize the device at will, and test both Terminal Kiosk Mode and Staff Personal Mode.
  * *Why*: Allows restaurant managers to set up an iPad or counter display in seconds without touching database consoles or configuration files.

* **Decision 3: Inactivity & Post-Punch Safety Timers**
  * *Chosen Approach*:
    1. 10-second post-punch countdown with immediate "Lock Now" bypass button.
    2. 30-second general inactivity timeout if someone enters their PIN and walks away without punching.
  * *Why*: Protects against the next employee accidentally clocking out under the previous employee's profile during busy lunch and dinner rushes.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AppContext State                                │
│                                                                             │
│  isDeviceAuthorizedTerminal: boolean                                       │
│  terminalConfig: { id: string, name: string, authorizedAt: string }         │
│  authorizeCurrentDevice(managerPin: string, terminalName: string): boolean   │
│  deauthorizeCurrentDevice(): void                                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Authorized Terminal       │             │     Personal Device View      │
│   (isDeviceAuthorized = true) │             │  (isDeviceAuthorized = false) │
├───────────────────────────────┤             ├───────────────────────────────┤
│ • Full Kiosk Keypad           │             │ • "Terminal Only" Notice      │
│ • Staff PIN Authentication    │             │ • Read-Only Shift Status      │
│ • Real-Time Punch Buttons     │             │ • Recent Timesheet Logs       │
│ • 10s Auto-Lock Countdown     │             │ • Manager "Authorize Device"  │
│ • 30s Idle Timeout            │             │   Affordance & Modal          │
└───────────────────────────────┘             └───────────────────────────────┘
```

#### A. Data Model & State Additions

* **`isDeviceAuthorizedTerminal`**: Boolean state initialized from `localStorage.getItem('malaya_is_terminal_authorized') === 'true'`.
* **`terminalMetadata`**: `{ terminalId: string, terminalName: string, authorizedAt: string, authorizedBy: string }`.
* **`authorizeDevice(pin: string, name?: string)`**: Validates manager PIN (`123456` or manager user PIN), sets authorization flags in storage, records an audit log entry in Firestore (`actionType: 'security'`), and enables terminal mode.
* **`deauthorizeDevice()`**: Clears terminal tokens, resets terminal lock state, and logs the revocation in the audit log.

#### B. Component Modifications

1. **`src/context/AppContext.tsx`**:
   * Add `isDeviceAuthorizedTerminal`, `terminalMetadata`, `authorizeDevice`, `deauthorizeDevice`.
   * Include terminal registration in Firestore sync and tamper-evident audit logs.
2. **`src/pages/staff/StaffClock.tsx`**:
   * Detect device authorization status.
   * If authorized: render the full workforce terminal with PIN verification, punch actions, and the 10-second countdown return timer.
   * If unauthorized: render the Personal Device read-only view with shift details, recent punches, and a manager authorization button.
3. **`src/components/AuthorizeDeviceModal.tsx`**:
   * Clean modal allowing managers to input their PIN and terminal nickname (e.g. "Counter Terminal #1", "Kitchen iPad") to register the hardware device.
