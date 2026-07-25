import {
  FileSpreadsheet,
  CreditCard,
  MessageCircle,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Video,
  PlayCircle,
  Clock,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Globe,
  BookOpenCheck,
  Laptop,
  Award,
  Languages,
  LineChart,
  Dumbbell,
  Users,
  UserPlus,
  Compass,
  Target,
} from "lucide-react";

/* -------- Pain points section -------- */
export const painPoints = [
  {
    icon: FileSpreadsheet,
    title: "Managing students on Excel/Google Sheets",
    body: "Tracking admissions, fees, and attendance manually.",
  },
  {
    icon: CreditCard,
    title: "Collecting payments one-by-one",
    body: "Following up with every student personally.",
  },
  {
    icon: MessageCircle,
    title: "Sending reminders on WhatsApp",
    body: "Typing the same fee and class reminders repeatedly.",
  },
  {
    icon: FolderOpen,
    title: "Sharing videos through Google Drive",
    body: "Links get forwarded, expire, or become disorganized.",
  },
  {
    icon: HelpCircle,
    title: "Answering the same student questions repeatedly",
    body: "\u201cWhere is the recording?\u201d, \u201cDid my payment go through?\u201d, \u201cWhen is the next class?\u201d",
  },
];
/* -------- Before vs After section -------- */
export const beforeAfter = [
  { before: "Excel sheets for students", after: "Centralized student database" },
  { before: "UPI screenshots in WhatsApp", after: "Automatic online payments" },
  { before: "Manual reminder messages", after: "Auto reminders by system" },
  { before: "Google Drive links", after: "Secure course portal" },
  { before: "Repeated student questions", after: "Self-service student dashboard" },
  { before: "Daily admin work", after: "Runs automatically" },
];
/* -------- Ecosystem pipeline section -------- */
export const pipeline = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    body: "Students can register or log in to their personal account and access their complete learning journey from one secure place.",
  },
  {
    icon: Compass,
    title: "Explore & Enroll",
    body: "Students can explore available courses, choose the right program, and purchase their course directly from the website.",
  },
  {
    icon: PlayCircle,
    title: "Access Your Learning Hub",
    body: "Access course videos, study sheets, PDFs, resources, and your personal learning panel anytime with your login.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    body: "Students can track their learning progress, stay updated with new content, and join live courses and interactive sessions.",
  },
  {
    icon: CreditCard,
    title: "Renew or Upgrade",
    body: "Get automatic payment reminders and easily renew your course or upgrade to a better learning plan directly from the website.",
  },
  {
    icon: Target,
    title: "Personalized Coaching",
    body: "Coaches and trainers can monitor student progress, identify areas for improvement, and provide personalized guidance when needed.",
  },
];

/* -------- Features section -------- */
export const features = [
  { icon: Globe, title: "High-Converting Landing Page", body: "Turn visitors into students with a professional digital presence built around your brand." },
  { icon: GraduationCap, title: "Student Dashboard", body: "A personalized space for courses, classes, assignments, payments, and progress." },
  { icon: LayoutDashboard, title: "Powerful Admin Dashboard", body: "Manage your entire learning operation from one centralized control panel." },
  { icon: BookOpen, title: "Course Management", body: "Create, organize, and manage courses, modules, and lessons with ease." },
  { icon: Video, title: "Live Class Integration", body: "Seamless access to scheduled live sessions, connected to your platform." },
  { icon: PlayCircle, title: "Recorded Course System", body: "Deliver on-demand learning with structured access to recorded content." },
  { icon: CreditCard, title: "Integrated Payment Gateway", body: "Make enrollment and payment effortless while keeping transactions organized." },
  { icon: Clock, title: "Attendance Management", body: "Track participation and maintain a clear record across every program." },
  { icon: ClipboardCheck, title: "Tests & Quizzes", body: "Build assessments that measure knowledge, engagement, and outcomes." },
  { icon: TrendingUp, title: "Student Progress Tracking", body: "Understand exactly how each student is moving through their journey." },
  { icon: BarChart3, title: "Analytics & Reports", body: "Turn learning and operational data into decisions you can act on." },
  { icon: MessageCircle, title: "WhatsApp & Email Automation", body: "Keep students informed with automated, timely communication." },
  { icon: ShieldCheck, title: "Role-Based Access", body: "Give students, instructors, and admins exactly the access they need." },
  { icon: Smartphone, title: "Mobile-Friendly Experience", body: "A seamless learning experience across desktop, tablet, and mobile." },
];
export const audience = [
  { icon: GraduationCap, title: "Coaching Institutes" },
  { icon: BookOpenCheck, title: "Tuition Centers" },
  { icon: Laptop, title: "Online Course Creators" },
  { icon: Award, title: "Skill Training Academies" },
  { icon: Languages, title: "Language Classes" },
  { icon: LineChart, title: "Trading / Marketing Coaches" },
  { icon: Dumbbell, title: "Fitness / Yoga Trainers" },
  { icon: Users, title: "Any Business With Students, Payments & Content" },
];


/* -------- Business impact section -------- */
export const impact = [
  { title: "Save Administrative Time", body: "Automate repetitive tasks and reduce manual work for your team." },
  { title: "Reduce Operational Workload", body: "Bring disconnected processes into one centralized platform." },
  { title: "Improve Student Experience", body: "A professional, seamless, organized learning environment." },
  { title: "Get Complete Visibility", body: "The information you need on students, courses, and operations." },
  { title: "Build a Stronger Brand", body: "A branded digital experience that reflects your professionalism." },
  { title: "Scale Without Chaos", body: "Support more students and courses without multiplying problems." },
];

/* -------- Process section (numbered — a real sequence) -------- */
export const process = [
  { n: "01", title: "Business Discussion", body: "We understand your business model, audience, challenges, and long-term vision." },
  { n: "02", title: "Requirement Analysis", body: "We map your workflows and identify the features your platform actually needs." },
  { n: "03", title: "UI/UX Design", body: "An intuitive, professional experience for students, instructors, and admins." },
  { n: "04", title: "Development", body: "Our team builds a powerful, scalable LMS tailored to your requirements." },
  { n: "05", title: "Testing & Optimization", body: "We test functionality, performance, responsiveness, and reliability." },
  { n: "06", title: "Deployment", body: "Your LMS is launched and configured for real-world use." },
  { n: "07", title: "Training & Support", body: "We help your team get comfortable, with ongoing support as you grow." },
];

/* -------- FAQ section -------- */
export const faqs = [
  { q: "What is a custom LMS?", a: "A custom Learning Management System is a platform built specifically around your business processes, learning model, brand, and operational requirements." },
  { q: "Can the LMS be customized for my business?", a: "Yes. The platform is designed around your specific workflows, user roles, courses, payment systems, communication requirements, and future goals." },
  { q: "Can I manage both live and recorded courses?", a: "Yes. Your LMS supports both live learning experiences and structured recorded course delivery." },
  { q: "Can students track their progress?", a: "Yes. Students get a personalized dashboard to view courses, learning activities, assignments, assessments, and progress." },
  { q: "Can I manage payments through the LMS?", a: "Yes. Payment gateway integration streamlines student enrollment and payment collection." },
  { q: "Can I automate communication?", a: "Yes. WhatsApp and email automation can be integrated to streamline student communication and updates." },
  { q: "Is the LMS mobile-friendly?", a: "Yes. The platform is designed for a seamless experience across desktop, tablet, and mobile devices." },
  { q: "Can the platform grow with my business?", a: "Absolutely. The LMS is built with scalability in mind, so your platform evolves as your business grows." },
];