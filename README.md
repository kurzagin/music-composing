# Music Production & Audio Visualizer Workspace

A structured production repository organizing FL Studio project files, rendered masters, video visuals, and the accompanying interactive React audio visualizer web application.

---

## 📁 Repository Structure

```text
├── projects/                      # FL Studio project versions & arrangements
│   ├── Project_1/                 # Project 1 (FLP + session backups)
│   │   ├── Project_1.flp
│   │   └── Backup/
│   ├── Project_2/                 # Project 2 (FLP arrangement revision)
│   │   └── Project_2.flp
│   └── Project_3/                 # Project 3 (Expanded arrangement with strings/bass)
│       └── Project_3.flp
├── audio/                         # Audio assets & mixdowns
│   ├── renders/                   # Exported stems and pre-masters (e.g., Project_1.wav)
│   └── samples/                   # Project-specific one-shots and loops
├── exports/                       # Final rendered multimedia outputs
│   └── video/                     # Visualizer video renders (papepo_full_standard_60fps.mp4)
├── visualizer/                    # Web-based audio visualizer (React + Tailwind + Vite)
│   ├── src/                       # Visualizer UI & rendering engine
│   ├── public/                    # Static preview assets (audio.wav)
│   └── convert_for_x.bat          # FFmpeg script for social-ready seeking MP4s
└── tools/                         # Production scripts & utilities
```

---

## 🎛️ FL Studio Setup

- **DAW Compatibility**: FL Studio 21 / 24+ (`26.1.4.5589` build series).
- **Project Files**:
  - `projects/Project_1/Project_1.flp`: Base foundation (Core 808s, Acoustic Piano).
  - `projects/Project_2/Project_2.flp`: Arrangement iteration.
  - `projects/Project_3/Project_3.flp`: Expanded arrangement with Violin, Cello, Bass & Lead lines.
- **Git Tracking**: FL Studio project files (`.flp`) are lightweight (~50–70 KB) and tracked directly in standard Git. Only large rendered media (`.wav`, `.mp4`) are managed through Git LFS.

Before cloning or checking out files on another machine:
```bash
git lfs install
git lfs pull
```

---

## 🎨 Visualizer Web App

An interactive audio waveform and spectrum visualizer built with React, Vite, Canvas API, and Tailwind CSS.

### Running Locally:
```bash
cd visualizer
npm install
npm run dev
```

### Building for Production:
```bash
cd visualizer
npm run build
```

### Video Conversion:
To re-encode rendered recordings for social platforms (e.g. X / Twitter) with FastStart MOOV seeking atoms and strict AAC:
```cmd
cd visualizer
convert_for_x.bat "path\to\downloaded_video.mp4"
```
