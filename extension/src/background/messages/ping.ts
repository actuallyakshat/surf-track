import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message =
    "Live now; make now always the most precious time. Now will never come again."
  res.send(message)
}

export default handler
