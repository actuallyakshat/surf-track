import { Request, Response } from "express";
import prisma from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function register(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    res.status(201).json({
      message: "User created successfully",
      data: newUser,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message,
      error: err,
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Username does not exists" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET as string
    );
    res.status(200).json({
      message: "Login successful",
      data: token,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error: error,
    });
  }
}
