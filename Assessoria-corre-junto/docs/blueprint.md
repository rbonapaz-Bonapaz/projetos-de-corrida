# **App Name**: CorreJunto

## Core Features:

- Multi-Tab Athlete Profile: Comprehensive profile management using a tabbed interface for General, Running (VO2 Max, T-Pace), Diet (Bulking/Cutting), and Strength (PRs and Splits) data, synchronized with Firestore.
- AI Periodization Engine: An AI-powered tool that generates 4-week periodized training blocks using VDOT logic and heart rate zones to create custom cycles (Base, Construction, Polishing).
- Gemini Interactive Coach: A conversational AI tool that acts as a running coach, processing workout histories and pasted data to refine and calibrate training plans in real-time.
- Biomechanical File Analyzer: Upload and process .FIT and .CSV files to extract advanced running metrics such as stride ratio, efficiency, and cadence.
- Performance Analytics Dashboard: Visualizes performance using Recharts to compare planned vs. realized volume, monitor pace trends, and project race times based on current T-Pace.
- Support Utility Suite: Includes specialized calculators for pace, split strategy, hydration/carb planning, along with a comprehensive runner's dictionary.
- Achievement and Records Vault: A persistent gallery to track personal records and athletic milestones, stored securely in a Firestore database.

## Style Guidelines:

- Strict Dark Theme: Primary background in deep charcoal-green (#0B0F0E) with branding using White (#FFFFFF) for 'Corre' and Emerald-600 (#059669) for 'Junto'.
- Accent highlights: Vibrant light-emerald (#3EDF5A) for active states and critical data visualization.
- Headlines use 'Space Grotesk' for a technical, high-performance look; body text uses 'Inter' for readability across dense data blocks.
- Modern card-based layout with a consistent 1rem border-radius and subtle tactical shadows for depth.
- Thin-line monochrome icons from Lucide React to maintain a professional, scientific aesthetic.
- Smooth page transitions and shimmer loading states for AI components using Framer Motion.