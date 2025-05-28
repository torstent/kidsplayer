import { redirectToAuthCodeFlow, newAccessToken, getAccessToken} from './spotifyUtils/auth.js'

import { setRepeat, setShuffle, startPawPatrol, togglePlayPause, skipBackward, skipForward, loadAlbumTracks } from './spotifyUtils/playerApi.js'

export const SpotifyAuth = {
  redirectToAuthCodeFlow: redirectToAuthCodeFlow,
  newAccessToken: newAccessToken,
  getAccessToken: getAccessToken
}

export const SpotifyPlayerApi = {
  setRepeat: setRepeat,
  setShuffle: setShuffle,
  startPawPatrol: startPawPatrol,
  togglePlayPause: togglePlayPause,
  skipBackward: skipBackward,
  skipForward: skipForward,
  loadAlbumTracks: loadAlbumTracks
}