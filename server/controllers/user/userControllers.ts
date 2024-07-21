import prisma from "../../db";

export async function getUser(req: any, res: any) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.body.userId,
      },
      include: {
        screenTime: true,
        blockedDomains: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.message,
      error: error,
    });
  }
}
