// Persistent file-backed data store with realistic seed records conforming to context/PROTOTYPE_PLAN.md
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSIST_FILE = path.join(__dirname, 'persistedStore.json');

export const BRANCH_QUOTAS = {
  CSE: { name: 'Computer Science & Engineering', code: 'CSE', totalSeats: 120, allotted: 98, confirmed: 84, cutoffRankWBJEE: 3200, cutoffRankJEE: 24000 },
  'CSE-AIML': { name: 'CSE (Artificial Intelligence & ML)', code: 'CSE-AIML', totalSeats: 60, allotted: 54, confirmed: 48, cutoffRankWBJEE: 4500, cutoffRankJEE: 31000 },
  IT: { name: 'Information Technology', code: 'IT', totalSeats: 60, allotted: 45, confirmed: 38, cutoffRankWBJEE: 5800, cutoffRankJEE: 42000 },
  CSBS: { name: 'Computer Science & Business Systems', code: 'CSBS', totalSeats: 60, allotted: 38, confirmed: 30, cutoffRankWBJEE: 7200, cutoffRankJEE: 53000 },
  ECE: { name: 'Electronics & Communication Engg.', code: 'ECE', totalSeats: 90, allotted: 62, confirmed: 50, cutoffRankWBJEE: 8500, cutoffRankJEE: 62000 }
};

export const FEE_SCHEDULE = {
  tuitionFee: 65000,
  labAndLibraryFee: 12000,
  cautionDeposit: 8000, // refundable
  totalAmount: 85000,
  currency: 'INR'
};

export const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACTION_REQUIRED',
  'VERIFIED_ELIGIBLE',
  'SEAT_OFFERED',
  'ADMISSION_CONFIRMED',
  'WAITLISTED',
  'REJECTED'
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'IEM-2026-1042',
    userId: 'usr_rahul_1042',
    status: 'SEAT_OFFERED',
    submissionDate: '2026-08-14T10:30:00Z',
    personal: {
      fullName: 'Rahul Sen',
      email: 'rahul.sen26@gmail.com',
      phone: '+91 98301 23456',
      dob: '2005-04-18',
      gender: 'Male',
      guardianName: 'Subhasish Sen',
      guardianPhone: '+91 98300 11223',
      guardianRelation: 'Father',
      address: '74/A Rashbehari Avenue, Ballygunge',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700029'
    },
    academic: {
      board10: 'ICSE',
      school10: 'South Point High School',
      year10: 2022,
      percent10: 92.4,
      physicsMarks: 94,
      chemistryMarks: 88,
      mathMarks: 96,
      pcmPercentage: 92.67,
      examType: 'WBJEE',
      examRoll: 'WBJEE-2026-88192',
      examRank: 2140
    },
    preferences: ['CSE', 'CSE-AIML', 'IT'],
    allottedBranch: 'CSE',
    allotmentDate: '2026-08-20T14:15:00Z',
    documents: {
      photo: { name: 'rahul_photo.jpg', verified: true, url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80' },
      admit10: { name: 'icse_admit_2022.pdf', verified: true, url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80' },
      marksheet12: { name: 'isc_marksheet_2024.pdf', verified: true, url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80' },
      rankCard: { name: 'wbjee_rankcard_2026.pdf', verified: true, url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=800&q=80' }
    },
    queries: [],
    payment: null,
    history: [
      { timestamp: '2026-08-14T10:30:00Z', event: 'Application Submitted', actor: 'Rahul Sen' },
      { timestamp: '2026-08-16T11:20:00Z', event: 'Under Review by Scrutiny Committee', actor: 'Prof. A. K. Banerjee' },
      { timestamp: '2026-08-18T16:00:00Z', event: 'Documents Verified & Eligible', actor: 'Admission Office' },
      { timestamp: '2026-08-20T14:15:00Z', event: 'Seat Offered: Computer Science & Engineering (Round 1)', actor: 'Central Allotment Engine' }
    ]
  },
  {
    id: 'IEM-2026-1088',
    userId: 'usr_ananya_1088',
    status: 'ADMISSION_CONFIRMED',
    submissionDate: '2026-08-12T09:15:00Z',
    personal: {
      fullName: 'Ananya Roy',
      email: 'ananya.roy@gmail.com',
      phone: '+91 98312 99887',
      dob: '2005-09-04',
      gender: 'Female',
      guardianName: 'Dr. Debabrata Roy',
      guardianPhone: '+91 98310 55443',
      guardianRelation: 'Father',
      address: 'Flat 4B, Silver Oak Residency, Salt Lake Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091'
    },
    academic: {
      board10: 'CBSE',
      school10: 'Delhi Public School Ruby Park',
      year10: 2022,
      percent10: 95.2,
      physicsMarks: 96,
      chemistryMarks: 94,
      mathMarks: 98,
      pcmPercentage: 96.0,
      examType: 'JEE Main',
      examRoll: 'JEE-2026-449102',
      examRank: 18240
    },
    preferences: ['CSE-AIML', 'CSE', 'IT'],
    allottedBranch: 'CSE-AIML',
    allotmentDate: '2026-08-17T12:00:00Z',
    studentId: 'IEM-BTECH-2026-042',
    documents: {
      photo: { name: 'ananya_passport.jpg', verified: true, url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
      admit10: { name: 'cbse_class10_admit.pdf', verified: true, url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80' },
      marksheet12: { name: 'cbse_class12_marks.pdf', verified: true, url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80' },
      rankCard: { name: 'jeemain_scorecard_2026.pdf', verified: true, url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=800&q=80' }
    },
    queries: [],
    payment: {
      orderId: 'order_iem_pay_908124',
      paymentId: 'pay_rzp_iem_88194012',
      amount: 85000,
      status: 'PAID',
      method: 'UPI / NetBanking',
      timestamp: '2026-08-19T15:42:10Z',
      receiptNumber: 'IEM/FEE/2026/0842'
    },
    history: [
      { timestamp: '2026-08-12T09:15:00Z', event: 'Application Submitted', actor: 'Ananya Roy' },
      { timestamp: '2026-08-14T11:00:00Z', event: 'Scrutiny Completed & Verified', actor: 'Dr. M. S. Ghosh' },
      { timestamp: '2026-08-17T12:00:00Z', event: 'Seat Offered: CSE (AI & ML)', actor: 'Admission Committee' },
      { timestamp: '2026-08-19T15:42:10Z', event: 'Semester Fee Paid (₹85,000 via Razorpay)', actor: 'Ananya Roy' },
      { timestamp: '2026-08-19T15:43:00Z', event: 'Admission Formally Confirmed. Student ID Generated: IEM-BTECH-2026-042', actor: 'Registrar Office' }
    ]
  },
  {
    id: 'IEM-2026-1145',
    userId: 'usr_sourav_1145',
    status: 'ACTION_REQUIRED',
    submissionDate: '2026-08-17T14:40:00Z',
    personal: {
      fullName: 'Sourav Banerjee',
      email: 'sourav.banerjee06@gmail.com',
      phone: '+91 97488 33219',
      dob: '2005-11-20',
      gender: 'Male',
      guardianName: 'Kamal Banerjee',
      guardianPhone: '+91 97488 22100',
      guardianRelation: 'Father',
      address: '12/3 Garia Station Road',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700084'
    },
    academic: {
      board10: 'WBBSE',
      school10: 'Jadavpur Vidyapith',
      year10: 2022,
      percent10: 89.2,
      physicsMarks: 85,
      chemistryMarks: 82,
      mathMarks: 88,
      pcmPercentage: 85.0,
      examType: 'WBJEE',
      examRoll: 'WBJEE-2026-33918',
      examRank: 5920
    },
    preferences: ['IT', 'ECE', 'CSBS'],
    documents: {
      photo: { name: 'sourav_photo.jpg', verified: true, url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
      admit10: { name: 'madhyamik_admit.pdf', verified: true, url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80' },
      marksheet12: { name: 'hs_marksheet_blurred.pdf', verified: false, flagged: true, url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80' },
      rankCard: { name: 'wbjee_rankcard.pdf', verified: true, url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=800&q=80' }
    },
    queries: [
      {
        id: 'qry_1145_01',
        field: 'Class 12 Marksheet',
        officer: 'Prof. S. Dutta (Scrutiny Member)',
        message: 'The uploaded Class 12 Marksheet image is blurry and the official council stamp and roll number are illegible. Please re-upload a clean, high-resolution scanned PDF or original photo.',
        timestamp: '2026-08-19T10:15:00Z',
        status: 'PENDING_STUDENT_RESPONSE',
        responses: []
      }
    ],
    history: [
      { timestamp: '2026-08-17T14:40:00Z', event: 'Application Submitted', actor: 'Sourav Banerjee' },
      { timestamp: '2026-08-19T10:15:00Z', event: 'Discrepancy Query Raised: Class 12 Marksheet blurry', actor: 'Prof. S. Dutta' }
    ]
  },
  {
    id: 'IEM-2026-1204',
    userId: 'usr_priya_1204',
    status: 'UNDER_REVIEW',
    submissionDate: '2026-08-18T16:20:00Z',
    personal: {
      fullName: 'Priya Das',
      email: 'priya.das.engg@gmail.com',
      phone: '+91 94330 87654',
      dob: '2005-07-12',
      gender: 'Female',
      guardianName: 'Swapan Das',
      guardianPhone: '+91 94330 11998',
      guardianRelation: 'Father',
      address: '88 Diamond Harbour Road, Behala',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700034'
    },
    academic: {
      board10: 'CBSE',
      school10: 'B.D.M. International School',
      year10: 2022,
      percent10: 91.0,
      physicsMarks: 89,
      chemistryMarks: 86,
      mathMarks: 92,
      pcmPercentage: 89.0,
      examType: 'WBJEE',
      examRoll: 'WBJEE-2026-44120',
      examRank: 4180
    },
    preferences: ['CSE', 'IT', 'ECE'],
    documents: {
      photo: { name: 'priya_photo.jpg', verified: false, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
      admit10: { name: 'cbse_admit.pdf', verified: false, url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80' },
      marksheet12: { name: 'cbse12_marks.pdf', verified: false, url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80' },
      rankCard: { name: 'wbjee_rank_priya.pdf', verified: false, url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=800&q=80' }
    },
    queries: [],
    history: [
      { timestamp: '2026-08-18T16:20:00Z', event: 'Application Submitted', actor: 'Priya Das' },
      { timestamp: '2026-08-19T09:00:00Z', event: 'Application Assigned to Officer Queue', actor: 'System' }
    ]
  },
  {
    id: 'IEM-2026-1250',
    userId: 'usr_arpan_1250',
    status: 'VERIFIED_ELIGIBLE',
    submissionDate: '2026-08-16T11:10:00Z',
    personal: {
      fullName: 'Arpan Mukherjee',
      email: 'arpan.mukherjee@gmail.com',
      phone: '+91 98366 12399',
      dob: '2005-02-15',
      gender: 'Male',
      guardianName: 'Subir Mukherjee',
      guardianPhone: '+91 98366 55000',
      guardianRelation: 'Father',
      address: '24 Beleghata Main Road',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700010'
    },
    academic: {
      board10: 'ICSE',
      school10: 'St. Xavier\'s Collegiate School',
      year10: 2022,
      percent10: 93.6,
      physicsMarks: 90,
      chemistryMarks: 86,
      mathMarks: 90,
      pcmPercentage: 88.67,
      examType: 'JEE Main',
      examRoll: 'JEE-2026-192831',
      examRank: 14200
    },
    preferences: ['CSE', 'CSE-AIML', 'IT'],
    documents: {
      photo: { name: 'arpan_pic.jpg', verified: true, url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
      admit10: { name: 'icse_admit.pdf', verified: true, url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80' },
      marksheet12: { name: 'isc_marksheet.pdf', verified: true, url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&q=80' },
      rankCard: { name: 'jeemain_rankcard.pdf', verified: true, url: 'https://images.unsplash.com/photo-1554415707-9e49fe83083f?w=800&q=80' }
    },
    queries: [],
    history: [
      { timestamp: '2026-08-16T11:10:00Z', event: 'Application Submitted', actor: 'Arpan Mukherjee' },
      { timestamp: '2026-08-17T15:30:00Z', event: 'Under Committee Review', actor: 'Prof. Partha Chakraborty' },
      { timestamp: '2026-08-19T14:00:00Z', event: 'Academic Credentials & Documents Verified. Awaiting Round 2 Allotment', actor: 'Scrutiny Committee' }
    ]
  }
];

// Helper to keep applications in persistent file storage with reset capability
class DataStore {
  constructor() {
    this.feeSchedule = JSON.parse(JSON.stringify(FEE_SCHEDULE));
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(PERSIST_FILE)) {
        const raw = fs.readFileSync(PERSIST_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.applications) && parsed.applications.length > 0) {
          this.applications = parsed.applications;
          this.quotas = parsed.quotas || JSON.parse(JSON.stringify(BRANCH_QUOTAS));
          console.log(`💾 [DataStore] Successfully loaded ${this.applications.length} applications from persistedStore.json`);
          return;
        }
      }
    } catch (err) {
      console.warn('⚠️ [DataStore] Could not read persistedStore.json, fallback to defaults:', err.message);
    }
    this.applications = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
    this.quotas = JSON.parse(JSON.stringify(BRANCH_QUOTAS));
    this.save();
  }

  save() {
    try {
      const data = {
        applications: this.applications,
        quotas: this.quotas,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(PERSIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 [DataStore] Saved ${this.applications.length} applications to persistedStore.json`);
    } catch (err) {
      console.error('⚠️ [DataStore] Failed to write persistedStore.json:', err.message);
    }
  }

  reset() {
    this.applications = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
    this.quotas = JSON.parse(JSON.stringify(BRANCH_QUOTAS));
    this.save();
    console.log('🔄 [DataStore] Reset store to initial seed records');
  }
}

export const store = new DataStore();
