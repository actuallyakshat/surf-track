const token = ""
export async function syncLocalDataWithBackend(userId: number): Promise<void> {
  // const data = JSON.parse(
  //   localStorage.getItem("screenTimeData") || "{}"
  // ) as Record<string, Record<string, number>>

  // if (Object.keys(data).length > 0) {
  //   try {
  //     const response = await fetch("https://your-backend-api.com/sync", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}` // Use the validated token
  //       },
  //       body: JSON.stringify({
  //         userId,
  //         activities: data
  //       })
  //     })

  //     if (response.ok) {
  //       localStorage.removeItem("screenTimeData")
  //     } else {
  //       console.error("Failed to sync data with backend")
  //     }
  //   } catch (error) {
  //     console.error("Error syncing data with backend", error)
  //   }
  // }
  console.log("Saving to database")
}
