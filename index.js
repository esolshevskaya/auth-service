const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sequelize, User } = require("./models");

const app = express();
app.use(express.json());

const SECRET = "secretkey";

function auth(roleRequired) {
    return (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader) return res.sendStatus(401);

        const token = authHeader.split(" ")[1];
        if (!token) return res.sendStatus(401);

        jwt.verify(token, SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user; // { id, role }
            if (roleRequired && user.role !== roleRequired) return res.sendStatus(403);
            next();
        });
    };
}

app.get("/", (req, res) => {
    res.send("The service is working!");
});

app.post("/register", async (req, res) => {
    try {
        const { fullName, birthDate, email, password, role } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            fullName,
            birthDate,
            email,
            password: hashed,
            role: role || "user",
            status: true
        });
        res.json({ message: "User registered", user });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1h" });
    res.json({ token });
});

app.get("/users/:id", auth(), async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);

    const requestingUser = await User.findByPk(userId);
    if (!requestingUser || !requestingUser.status) return res.sendStatus(403);

    if (requestingUser.role !== "admin" && userId !== id) return res.sendStatus(403);

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
});

app.get("/users", auth("admin"), async (req, res) => {
    const users = await User.findAll();
    res.json(users);
});

app.post("/users/:id/block", auth(), async (req, res) => {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);

    if (req.user.role !== "admin" && userId !== id) return res.sendStatus(403);

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.status = false;
    await user.save();
    res.json({ message: "User blocked" });
});

app.delete("/users", auth("admin"), async (req, res) => {
    try {
        await User.destroy({ where: {}, truncate: true });
        await sequelize.query("DELETE FROM sqlite_sequence WHERE name='Users';");
        res.json({ message: "All users deleted" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

sequelize.sync().then(() => {
    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
});