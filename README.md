# Hamza's Lab

My portfolio as a cozy 3D room: a rainy night, a desk setup, a workbench, lofi music.
Live at **https://hamzacharif.github.io/Hamza_AlCharif/**

## Updating the content (no code needed)

Everything you read on the site lives in **`public/content.json`**:

- `profile`: name, role, email, LinkedIn, GitHub, CV link
- `sections.projects.items`: projects on the main monitor
- `sections.building.items`: ongoing projects (shown at the 3D printer and the drone)
- `sections.experience`, `awards`, `skills`, `about`, `music`

To add a project, copy one item block and change the fields:

```json
{
  "name": "My new project",
  "status": "ongoing",
  "progress": 40,
  "period": "2027",
  "summary": "One or two sentences about it.",
  "tags": ["Python", "Jetson"],
  "links": [{ "label": "Code", "href": "https://github.com/HamzaCharif/..." }]
}
```

`status` is `done`, `ongoing` or `planned`. `progress` (0-100) shows for ongoing items.

Replace the CV at `public/media/Hamza_AlCharif_CV.pdf` to update the download.

Push to `main` and the site rebuilds by itself in about a minute.

## Running it locally

```bash
npm install
npm run dev
```

## Credits

3D models: see `public/models/CREDITS.md`. Rain, thunder and lofi tracks are generated in the browser.
