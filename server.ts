import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getUsers } from "./src/db/users.ts";

dotenv.config();

// Ensure uncaught exceptions/rejections don't crash the server process
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User auth sync
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || "unknown@user.com",
        req.user.name || undefined
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Error syncing user:", error);
      res.status(500).json({ error: error.message || "Failed to sync user" });
    }
  });

  // Get database users
  app.get("/api/users", requireAuth, async (req: AuthRequest, res) => {
    try {
      const usersList = await getUsers();
      res.json(usersList);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Explicit download endpoint for Food handler skills and knowledge checklist
  const handleChecklistDownload = (req: express.Request, res: express.Response) => {
    const pubFile = path.join(process.cwd(), "public", "Food handler skills and knowledge checklist.pdf");
    const distFile = path.join(process.cwd(), "dist", "Food handler skills and knowledge checklist.pdf");
    const targetFile = fs.existsSync(pubFile) ? pubFile : distFile;
    if (fs.existsSync(targetFile)) {
      res.download(targetFile, "Food handler skills and knowledge checklist.pdf");
    } else {
      res.status(404).send("Document not found");
    }
  };

  app.get("/Food handler skills and knowledge checklist.pdf", handleChecklistDownload);
  app.get("/Food%20handler%20skills%20and%20knowledge%20checklist.pdf", handleChecklistDownload);
  app.get("/Food_handler_skills_and_knowledge_checklist.pdf", handleChecklistDownload);

  // Explicit download endpoint for TFN declaration form
  const handleTfnDownload = (req: express.Request, res: express.Response) => {
    const pubFile = path.join(process.cwd(), "public", "TFN_declaration_form_N3092.pdf");
    const distFile = path.join(process.cwd(), "dist", "TFN_declaration_form_N3092.pdf");
    const targetFile = fs.existsSync(pubFile) ? pubFile : distFile;
    if (fs.existsSync(targetFile)) {
      res.download(targetFile, "TFN_declaration_form_N3092.pdf");
    } else {
      res.status(404).send("Document not found");
    }
  };

  app.get("/TFN_declaration_form_N3092.pdf", handleTfnDownload);

  // Vite middleware for development (with hmr disabled for AI Studio environment)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application dist build not found. Please run npm run build.");
      }
    });
  }

  // Global Express error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Server Error]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Server] Port ${PORT} already in use. Retrying in 1000ms...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error("[Server] Fatal server error:", err);
    }
  });

  const shutdown = () => {
    console.log("[Server] Shutting down gracefully...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("[Server] Failed to start server:", err);
});
