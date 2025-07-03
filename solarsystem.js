const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('solarSystemCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1.5);
scene.add(sunLight);

const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);


const textureLoader = new THREE.TextureLoader();
textureLoader.load('https://threejs.org/examples/textures/lensflare/lensflare0.png', (texture) => {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: 0xffff88,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(5,5,1);
  sun.add(sprite);
});

const planets = [];
const labels = [];
const orbits = [];
const planetData = [
  { name: 'Mercury', distance: 2, color: 0xaaaaaa },
  { name: 'Venus', distance: 3, color: 0xffcc00 },
  { name: 'Earth', distance: 4, color: 0x0000ff },
  { name: 'Mars', distance: 5, color: 0xff0000 },
  { name: 'Jupiter', distance: 6, color: 0xffa500 },
  { name: 'Saturn', distance: 7, color: 0xd2b48c },
  { name: 'Uranus', distance: 8, color: 0xadd8e6 },
  { name: 'Neptune', distance: 9, color: 0x00008b }
];

const relativeSpeeds = {
  Mercury: 4.15,
  Venus: 1.62,
  Earth: 1,
  Mars: 0.53,
  Jupiter: 0.084,
  Saturn: 0.034,
  Uranus: 0.012,
  Neptune: 0.006
};

planetData.forEach(data => {
  const geometry = new THREE.SphereGeometry(0.4, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: data.color,
    emissive: data.color,
    emissiveIntensity: 0.6,
    metalness: 0.5,
    roughness: 0.3
  });
  const planet = new THREE.Mesh(geometry, material);
  planet.position.x = data.distance;
  scene.add(planet);
  planets.push({
    mesh: planet,
    speed: relativeSpeeds[data.name] * 0.01,
    rotationSpeed: 0.01
  });

  const div = document.createElement("div");
  div.className = "label";
  div.textContent = data.name;
  div.style.position = "absolute";
  div.style.color = document.body.classList.contains("light-mode") ? "#000" : "#fff";
  div.style.fontSize = "13px";
  div.style.fontWeight = "bold";
  div.style.pointerEvents = "none";
  document.body.appendChild(div);
  labels.push(div);

 
  const orbitGeometry = new THREE.BufferGeometry();
  const segments = 128;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * 2 * Math.PI;
    points.push(
      Math.cos(theta) * data.distance,
      0,
      Math.sin(theta) * data.distance
    );
  }
  orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    opacity: 1.0,
    transparent: false
  });
  const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
  scene.add(orbit);
  orbits.push(orbit);
});

function createStars(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < count; i++) {
    const radius = 100;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    depthTest: false
  });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}
const stars = createStars(500);

camera.position.set(15, 10, 15);
camera.lookAt(0, 0, 0);

let isPaused = false;
let speedMultiplier = 1;
let cameraAngle = 0;

function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    const time = Date.now() * 0.001;
    cameraAngle += 0.0005;
    camera.position.x = 15 * Math.cos(cameraAngle);
    camera.position.z = 15 * Math.sin(cameraAngle);
    camera.lookAt(0,0,0);

    planets.forEach((planet, i) => {
      planet.mesh.rotation.y += 0.01;
      const distance = planetData[i].distance;
      const angle = time * (planet.speed * 30 * speedMultiplier);
      planet.mesh.position.x = Math.cos(angle) * distance;
      planet.mesh.position.z = Math.sin(angle) * distance;

      const vector = planet.mesh.position.clone().project(camera);
      const x = (vector.x + 1) / 2 * window.innerWidth;
      const y = -(vector.y - 1) / 2 * window.innerHeight;
      labels[i].style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
      labels[i].style.display = vector.z < 1 ? "block" : "none";
    });
  }
  renderer.render(scene, camera);
}
animate();

// Sliders
planetData.forEach((data, i) => {
  const slider = document.getElementById(`${data.name.toLowerCase()}Speed`);
  slider.value = planets[i].speed.toFixed(3);
  slider.addEventListener('input', e => {
    planets[i].speed = parseFloat(e.target.value);
  });
});

document.getElementById('speedMultiplier').addEventListener('input', e => {
  speedMultiplier = parseFloat(e.target.value);
});

document.getElementById('pauseResumeBtn').addEventListener('click', e => {
  isPaused = !isPaused;
  e.target.textContent = isPaused ? 'Resume' : 'Pause';
});


document.getElementById('toggleThemeBtn').addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light-mode');
  scene.background = new THREE.Color(isLight ? 0xe0e0e0 : 0x000000);

  orbits.forEach(orbit => {
    orbit.material.color.set(isLight ? 0x000000 : 0xffffff);
  });

  stars.material.color.set(isLight ? 0x000000 : 0xffffff);

  labels.forEach(label => {
    label.style.color = isLight ? "#000" : "#fff";
  });
});


document.getElementById('controlHeader').addEventListener('click', () => {
  const panel = document.getElementById('controlPanel');
  panel.classList.toggle('collapsed');
  document.getElementById('togglePanelBtn').textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
});


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const planetInfo = {
  Mercury: { distance: "57.9 million km", period: "88 Earth days" },
  Venus: { distance: "108.2 million km", period: "225 Earth days" },
  Earth: { distance: "149.6 million km", period: "365 Earth days" },
  Mars: { distance: "227.9 million km", period: "687 Earth days" },
  Jupiter: { distance: "778.3 million km", period: "12 Earth years" },
  Saturn: { distance: "1.43 billion km", period: "29 Earth years" },
  Uranus: { distance: "2.87 billion km", period: "84 Earth years" },
  Neptune: { distance: "4.5 billion km", period: "165 Earth years" }
};

window.addEventListener('click', event => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    const planetName = planetData.find(p => p.color === clicked.material.color.getHex()).name;

    document.getElementById('infoTitle').textContent = planetName;
    document.getElementById('infoDistance').textContent = `Distance from Sun: ${planetInfo[planetName].distance}`;
    document.getElementById('infoPeriod').textContent = `Orbital Period: ${planetInfo[planetName].period}`;
    document.getElementById('infoPanel').style.display = 'block';
  }
});

document.getElementById('closeInfoBtn').addEventListener('click', () => {
  document.getElementById('infoPanel').style.display = 'none';
});
