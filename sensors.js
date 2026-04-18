// --- SENSOR ENGINE ---
// Handles mobile accelerometer reading for Jump and Shake gestures

let alreadySentJump = false;
let alreadySentShake = false;

function requestMotionPermissions() {
    // Request motion permission for iOS 13+ devices
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(permissionState => {
            if (permissionState === 'granted') {
                window.addEventListener('devicemotion', handleMotion);
            }
        }).catch(console.error);
    } else {
        // Non-iOS 13+ devices
        window.addEventListener('devicemotion', handleMotion);
    }
}

function handleMotion(event) {
    let acc = event.accelerationIncludingGravity;
    if (!acc) return;

    // We try to use linear acceleration if available, otherwise fallback to rough gravity calculation
    let ax = event.acceleration ? event.acceleration.x || 0 : 0;
    let ay = event.acceleration ? event.acceleration.y || 0 : 0;
    let az = event.acceleration ? event.acceleration.z || 0 : 0;

    let magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

    // If linear acceleration isn't reported accurately, we fallback
    if (magnitude === 0 && acc) {
        // Very basic heuristic using gravity changes 
        magnitude = Math.abs(Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z) - 9.8);
    }

    if (magnitude > 18 && !alreadySentShake) {
        alreadySentShake = true;

        // Requires analytics.js loaded first to call this function
        if (typeof sendLiveNotification === 'function') {
            sendLiveNotification('dude vigorously SHOOK her phone in excitement/frustration');
        }
        setTimeout(() => alreadySentShake = false, 10000);
    } else if (magnitude > 12 && magnitude <= 18 && !alreadySentJump) {
        alreadySentJump = true;

        // Requires analytics.js loaded first to call this function
        if (typeof sendLiveNotification === 'function') {
            sendLiveNotification('dude she JUMPED or did a sudden movement');
        }
        setTimeout(() => alreadySentJump = false, 10000);
    }
}
