import express from "express";

const router = express.Router();

router.get("/login", (_request, response) => {
  response.render("login", {});
});

router.post("/login", (request, response) => {
    response.render("lobby");

    //console.log(request.body.username);
    //console.log(request.body.password);

    //response.render("lobby");
});

router.get("/register", (_request, response) => {
  response.render("register");
});

router.post("/register", (request, response) => {
    console.log(request.body.username);
    console.log(request.body.password);

    response.render("login");
});

router.post("/logout", (request, response) => {
    response.render("/");
});

export { router as authRoutes };