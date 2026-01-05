

# Refound---Lost-and-Found
=======
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

---

## Google Vision integration (prototype)

This project includes a simple prototype for matching a user-uploaded image against found items using Google Vision's REST API.

Quick start:

1. Create a Google Cloud project and enable the Vision API.
2. Add an API key (or ideally a server-side service account) and set it in your local env file:

   - Create a `.env` file at the project root with:
     `VITE_GOOGLE_API_KEY=your_api_key_here`

3. Start the dev server:
   `npm run dev`

Notes & recommendations:

- The current implementation calls Vision directly from the client for a fast prototype (see `src/lib/googleVision.ts`). This exposes your API key to the browser — acceptable for prototype but NOT recommended for production.
  - If `VITE_GOOGLE_API_KEY` is not set, the app will gracefully fall back to embedding-only matching (no Vision labels). This lets you test local matching without an API key.
- For production: implement a server endpoint that calls Vision securely using a service account and keeps credentials off the client (see `src/lib/store.ts` for a simple in-memory demo store).
- The matching algorithm originally used label overlap (Jaccard). I added an **embedding-based matcher** (using `@tensorflow/tfjs` + `@tensorflow-models/mobilenet`) that computes image embeddings and ranks candidates using cosine similarity. This significantly improves visual matching.

Notes on embeddings:

- Install the new dependencies:

  `npm install @tensorflow/tfjs @tensorflow-models/mobilenet`

- The first time embeddings are computed, the browser will download a small mobilenet model — expect an extra network request and some CPU work in the client. For production, consider computing embeddings server-side and storing them in a vector DB (e.g., Pinecone, Milvus, or an open-source alternative).



## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
>>>>>>> a5a4810 (Initial push)
