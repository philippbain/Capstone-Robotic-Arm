# Capstone Robotic Arm - Next.js Template

This repository includes a Next.js presentation website using the App Router.

## Current Site Structure

- `/`: Scroll-driven project story with animated 3D robotic arm stage
- `/about`: Team members and role overview

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev`: Run local development server
- `npm run build`: Create production build
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## CAD Integration

Drop your exported arm model at:

- `public/models/robot-arm.glb`

The first iteration currently uses a procedural 3D arm for the scrolling demo and is ready for swapping to your CAD asset.
