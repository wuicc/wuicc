import axios from 'axios'

export const getAnnouncements = async (lang, gamesConfig) => {
  const data = {
    games: Object.keys(gamesConfig),
    activities: gamesConfig
  }
  
  const encodedData = btoa(JSON.stringify(data))
  
  try {
    const response = await axios.get('/api/announcements', {
      params: { lang, data: encodedData },
      timeout: 5000
    })
    return response.data.data.announcements
  } catch (error) {
    console.error('Error fetching ann list:', error)
    throw error
  }
}