import express from "express";

const router = express.Router();

router.get("/", (_request, response) => {
  response.render("register", {});
});

router.post("/", (request, response) => {
    console.log(request.body.username);
    console.log(request.body.password);

    response.render("login", {});
});

export { router as registerRoutes };