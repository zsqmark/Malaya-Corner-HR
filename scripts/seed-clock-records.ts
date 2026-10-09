import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import cfg from '../firebase-applet-config.json';
import { ClockRecord } from '../src/types';

const STAFF_LIST = [
  { id: 'staff-john', name: 'John Tan', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-lerica', name: "L'Erica Wong", pos: 'Wait Staff', rate: 27.0 },
  { id: 'staff-bowie', name: 'Bowie Chen', pos: 'Bar Staff & Senior Server', rate: 28.0 },
  { id: 'staff-kai', name: 'Kai Lin', pos: 'Bar Staff', rate: 26.5 },
  { id: 'staff-maria', name: 'Maria Santos', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-marcus', name: 'Marcus Ng', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-yannie', name: 'Yannie Khoo', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-manuel', name: 'Manuel Reyes', pos: 'Kitchen Hand / Runner', rate: 27.5 },
  { id: 'staff-erica', name: 'Erica Chow', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-iu', name: 'IU Lee', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-chloe', name: 'Chloe Lin', pos: 'Bar Staff', rate: 26.0 },
  { id: 'staff-veronica', name: 'Veronica Tan', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-yen', name: 'Yen Vo', pos: 'Wait Staff', rate: 26.5 },
  { id: 'staff-france', name: 'France Delacruz', pos: 'Wait Staff', rate: 27.0 },
];

const LUNCH_INS = ['11:00', '11:15', '11:30'];
const LUNCH_OUTS = ['14:30', '14:45', '15:00', '15:15'];
const DINNER_INS = ['16:30', '16:45', '17:00'];
const DINNER_OUTS = ['21:30', '21:45', '22:00', '22:15'];

const NOTES_LUNCH = [
  'Lunch service floor setup',
  'Table 1-12 section runner',
  'Bar smoothie & teh tarik prep',
  'Dim sum and lunch set rush',
  'Register & greeting desk',
  'Bain-marie broth temperature check',
];

const NOTES_DINNER = [
  'Dinner peak floor service',
  'Closing sanitisation & mop',
  'Bar closing & cocktail station stock',
  'Evening dishpass & floor clearing',
  'Main dining room closing supervisor support',
  'POS reconciliation assistance',
];

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function generateRandomClockRecords(): ClockRecord[] {
  const records: ClockRecord[] = [];
  let idCounter = 101;
  const existingKeySet = new Set<string>();

  // September roster week dates (Monday 2026-09-07 to Sunday 2026-09-13)
  const rosterDays = [
    { date: '2026-09-07', label: 'MON' },
    { date: '2026-09-08', label: 'TUE' },
    { date: '2026-09-09', label: 'WED' },
    { date: '2026-09-10', label: 'THU' },
    { date: '2026-09-11', label: 'FRI' },
    { date: '2026-09-12', label: 'SAT' },
    { date: '2026-09-13', label: 'SUN' },
  ];

  rosterDays.forEach((d, dayIdx) => {
    // Deterministic distribution per day
    // Staff 0..4 do lunch, Staff 4..9 do dinner (Staff 4 does double shift)
    const lunchStaff = [
      STAFF_LIST[dayIdx % STAFF_LIST.length],
      STAFF_LIST[(dayIdx + 1) % STAFF_LIST.length],
      STAFF_LIST[(dayIdx + 2) % STAFF_LIST.length],
      STAFF_LIST[(dayIdx + 3) % STAFF_LIST.length],
    ];

    const dinnerStaff = [
      STAFF_LIST[(dayIdx + 3) % STAFF_LIST.length], // double shift on dayIdx+3
      STAFF_LIST[(dayIdx + 4) % STAFF_LIST.length],
      STAFF_LIST[(dayIdx + 5) % STAFF_LIST.length],
      STAFF_LIST[(dayIdx + 6) % STAFF_LIST.length],
      STAFF_LIST[(dayIdx + 7) % STAFF_LIST.length],
    ];

    // Lunch shifts (11:00 - 15:00)
    lunchStaff.forEach((staff, idx) => {
      const key = `${staff.id}_${d.date}_lunch`;
      if (existingKeySet.has(key)) return;
      existingKeySet.add(key);

      const inTime = LUNCH_INS[idx % LUNCH_INS.length];
      const outTime = LUNCH_OUTS[(idx + 1) % LUNCH_OUTS.length];
      const breakM = idx % 2 === 0 ? 15 : 0;
      const totalM = timeToMins(outTime) - timeToMins(inTime) - breakM;
      const totalHours = Number((totalM / 60).toFixed(2));

      records.push({
        id: `clk-rec-${idCounter++}`,
        staffId: staff.id,
        staffName: staff.name,
        position: staff.pos,
        date: d.date,
        shiftType: 'lunch',
        clockInTime: inTime,
        clockOutTime: outTime,
        breakMinutes: breakM,
        totalHours,
        status: 'approved',
        hourlyRate: staff.rate,
        notes: NOTES_LUNCH[idx % NOTES_LUNCH.length],
      });
    });

    // Dinner shifts (16:30 - 22:15) - exactly ONE dinner shift per staff member
    dinnerStaff.forEach((staff, idx) => {
      const key = `${staff.id}_${d.date}_dinner`;
      if (existingKeySet.has(key)) return;
      existingKeySet.add(key);

      const inTime = DINNER_INS[idx % DINNER_INS.length];
      const outTime = DINNER_OUTS[(idx + 2) % DINNER_OUTS.length];
      const breakM = 30;
      const totalM = timeToMins(outTime) - timeToMins(inTime) - breakM;
      const totalHours = Number((totalM / 60).toFixed(2));

      records.push({
        id: `clk-rec-${idCounter++}`,
        staffId: staff.id,
        staffName: staff.name,
        position: staff.pos,
        date: d.date,
        shiftType: 'dinner',
        clockInTime: inTime,
        clockOutTime: outTime,
        breakMinutes: breakM,
        totalHours,
        status: 'approved',
        hourlyRate: staff.rate,
        notes: NOTES_DINNER[idx % NOTES_DINNER.length],
      });
    });
  });

  // Also add today's live shift records for real-time demonstration
  const todayStr = '2026-10-09';
  records.push({
    id: `clk-rec-${idCounter++}`,
    staffId: 'staff-john',
    staffName: 'John Tan',
    position: 'Wait Staff',
    date: todayStr,
    shiftType: 'dinner',
    clockInTime: '16:45',
    breakMinutes: 0,
    status: 'clocked_in',
    hourlyRate: 26.5,
    notes: 'Floor table runner • Currently on active shift',
  });
  records.push({
    id: `clk-rec-${idCounter++}`,
    staffId: 'staff-bowie',
    staffName: 'Bowie Chen',
    position: 'Bar Staff & Senior Server',
    date: todayStr,
    shiftType: 'dinner',
    clockInTime: '16:30',
    breakMinutes: 15,
    breakStartTime: '18:15',
    status: 'on_break',
    hourlyRate: 28.0,
    notes: 'Bar service & beverage prep • On 15m meal break',
  });

  return records;
}

async function main() {
  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  // Clear existing records first to avoid old duplicate records
  const { getDocs, deleteDoc } = await import('firebase/firestore');
  const existingDocs = await getDocs(collection(db, 'clockRecords'));
  console.log(`Clearing ${existingDocs.size} existing clock records...`);
  for (const docSnap of existingDocs.docs) {
    await deleteDoc(docSnap.ref);
  }

  const generated = generateRandomClockRecords();
  console.log(`Generated ${generated.length} cleanly structured clock in/out records.`);

  for (const rec of generated) {
    const cleanRec = Object.fromEntries(
      Object.entries(rec).filter(([_, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'clockRecords', rec.id), cleanRec);
  }

  console.log(`Successfully committed ${generated.length} unique records to Firestore collection 'clockRecords'!`);
  process.exit(0);
}

if (import.meta.url.endsWith(process.argv[1])) {
  main().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
