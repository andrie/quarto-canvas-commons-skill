// Starts and stops the animation on each slide as it is shown or left (reveal.js decks).
// Debug logging control
const DEBUG_ENABLED = false; // Set to true to enable debug logging
function debugLog(...args) {
  if (DEBUG_ENABLED) {
    console.log(...args);
  }
}

// stop the animation if the loop attribute is set to false
function stopAnimation(event) {
  debugLog('DEBUG: stopAnimation called', event ? 'with event' : 'without event');
  const player = Reveal.getCurrentSlide().querySelector('canvas-commons-player');
  debugLog('DEBUG: player found:', !!player);
  if (player) {
    debugLog('DEBUG: player loop attribute:', player.getAttribute('loop'));
    debugLog('DEBUG: player auto attribute:', player.getAttribute('auto'));

    // this code assumes one animation per slide
    // TODO: make it work with multiple animations per slide

    // start the animation, unless the shortcode said auto=false
    if (player.getAttribute('auto') !== 'false') {
      debugLog('canvas-commons: setting auto to true')
      player.setAttribute('auto', 'true');
    }


    const startCheckInterval = setInterval(() => {
      // wait for player to start
      debugLog('canvas-commons: checking player...')
      if (player.player) {
        clearInterval(startCheckInterval);
        const fps = 60; // frames per second
        let maxf = 0;
        if (player.getAttribute('loop') === 'false'  ) {
          debugLog('DEBUG: loop is false, setting up frame check interval')
          const frameCheckInterval = setInterval(() => {
            if (player.player && !player.player.active) {
              debugLog('DEBUG: reactivating inactive player');
              player.player.activate()
            }
            if (player.player && player.player.frame) {
              const f = player.player.frame.value;
              const nf = player.player.endFrame;
              debugLog('DEBUG: frame check - current:', f, 'end:', nf);

              // Track the maximum frame we've seen
              if (f > maxf) {
                maxf = f;
              }

              // Stop if we've reached the end frame, or if we've looped back to start after being near the end
              if (f === nf || (maxf >= nf - 1 && f < 10)) {
                debugLog('DEBUG: animation complete, stopping (maxf:', maxf, 'current:', f, 'end:', nf, ')');
                clearInterval(frameCheckInterval);

                // First deactivate the player to stop playback
                debugLog('DEBUG: deactivating player');
                player.player.deactivate();

                // Then seek to the end frame
                setTimeout(() => {
                  debugLog('DEBUG: seeking to end frame after deactivation');
                  player.player.requestSeek(nf);

                  // Verify the final frame
                  setTimeout(() => {
                    if (player.player && player.player.frame) {
                      const finalFrame = player.player.frame.value;
                      debugLog('DEBUG: final frame after seek:', finalFrame);
                    }
                  }, 100);
                }, 50);
              }
            }
          }, 1000 / fps); // Check every frame
          
          // Clear the interval when the slide changes
          Reveal.addEventListener('slidechanged', () => {
            debugLog('DEBUG: slide changed, clearing frame check interval');
            clearInterval(frameCheckInterval);
          });
        } else {
          debugLog('DEBUG: loop is not false (loop attribute value is:', player.getAttribute('loop'), ')');
        }
      }
    }, 50)  // wait for player to start

  }

  // pause the previous slide if it contains an animation
  debugLog('DEBUG: checking previous slide for animations');
  if (event && event.previousSlide) {
    const prevPlayer = event.previousSlide.querySelector('canvas-commons-player');
    debugLog('DEBUG: previous player found:', !!prevPlayer);
    if (prevPlayer) {
      debugLog('DEBUG: pausing previous player');
      // pass false explicitly: with no argument the call toggles, which restarts a finished loop=false scene
      prevPlayer.player?.togglePlayback(false);
    }
  }
}

// Check every 100ms if Reveal is defined
document.addEventListener("DOMContentLoaded", function() {
  const checkReveal = setInterval(function() {
    if (window.Reveal && Reveal.isReady()) {
      // If Reveal is defined, set up the event listener and clear the interval
      // console.log("Reveal is ready")
      stopAnimation()
      Reveal.on('slidechanged', stopAnimation);
      clearInterval(checkReveal);
    }
  }, 50);
});
