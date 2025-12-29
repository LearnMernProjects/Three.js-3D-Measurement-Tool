Three.js 3D Measurement Tool

This project is an interactive 3D measurement tool built using Three.js and TypeScript. The goal of the project was to create a practical, CAD-style measurement system that allows users to measure distances directly inside a 3D scene using simple mouse interactions.

The focus was not only on making something that works, but on understanding how real-world 3D tools handle interaction, geometry, and usability.

What the Project Does

Allows users to click two points in a 3D scene to measure distance

Shows a dashed preview line while measuring

Renders a final measurement line with arrowheads and extension lines

Displays the measured distance clearly below the line

Shows distance and angle values (X, Y, Z) in a UI panel

Supports undo, clear, and enable/disable actions

Includes keyboard shortcuts for faster interaction

How It Works

The tool uses raycasting to convert mouse clicks into accurate world-space positions. A two-click workflow is implemented:

First click sets the start point

Second click finalizes the measurement

During measurement, a dashed line provides visual feedback. Once completed, the tool draws a clean dimension line along with arrowheads and a distance label aligned with the measurement.

The logic is organized using a system-based structure so that interaction handling, rendering, and UI logic remain separate and manageable.

Challenges Faced

One of the main challenges was handling text labels in 3D space. Using sprites initially caused orientation and readability issues because sprites always face the camera. This required careful handling of rotation, placement, and resolution to keep the distance label readable and visually stable.

Another challenge was managing state between UI and 3D interactions, especially when adding undo, clear, and keyboard shortcuts without breaking the measurement flow.

Debugging Git issues during the initial repository setup was also a learning experience, particularly around merging unrelated histories and proper .gitignore usage.

What Went Well

Raycasting and interaction logic worked reliably

The measurement workflow feels intuitive and responsive

UI controls and keyboard shortcuts improved usability

Code structure remained clean and extensible

Tech Stack

Three.js

TypeScript

Vite

HTML / CSS (for UI panel)

How to Run
npm install
npm run dev

Possible Improvements

Axis locking (X/Y/Z constraints)

Grid snapping for precision

Measurement list and selection

Exporting measurements to JSON or CSV

Final Note

This project helped solidify practical knowledge of Three.js interaction patterns, vector math, and system design. It is designed as a foundation that can be extended further, rather than a one-off demo.
