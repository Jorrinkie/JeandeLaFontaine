/* =========================================================
   3D-WERELD — Het dorp van Jean (three.js, procedureel)
   Zelfstandige module. app.js roept FLFWorld.launchVillage aan.
   ========================================================= */
(function () {
  "use strict";
  window.FLFWorld = { launchVillage: launchVillage };

  function launchVillage(container, api) {
    const THREE = window.THREE;
    if (!THREE) { api.toast && api.toast("3D kon niet laden."); return null; }

    const getW = () => container.clientWidth || 800;
    const getH = () => container.clientHeight || 480;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(getW(), getH());
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "grab";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fc4ea);
    scene.fog = new THREE.Fog(0x9fc4ea, 40, 110);

    const camera = new THREE.PerspectiveCamera(65, getW() / getH(), 0.1, 400);

    /* ---- licht ---- */
    scene.add(new THREE.HemisphereLight(0xffffff, 0x7a8a55, 0.95));
    const sun = new THREE.DirectionalLight(0xfff1cf, 0.85);
    sun.position.set(24, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    scene.add(sun);

    /* ---- helpers ---- */
    const M = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.9 : r, metalness: m || 0 });
    function box(w, h, d, mat) { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); g.castShadow = true; g.receiveShadow = true; return g; }

    /* ---- grond & pad ---- */
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), M(0x82a457, 1));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 60), M(0xcbb289, 1));
    path.rotation.x = -Math.PI / 2; path.position.set(0, 0.02, -2); path.receiveShadow = true; scene.add(path);

    const colliders = []; // {x,z,r}

    /* ---- bouwstenen ---- */
    function tree(x, z) {
      const g = new THREE.Group();
      const trunk = box(0.5, 2, 0.5, M(0x7a5230)); trunk.position.y = 1; g.add(trunk);
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.4, 8), M(0x3f6b3a)); f1.position.y = 3; f1.castShadow = true; g.add(f1);
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2, 8), M(0x4f7d45)); f2.position.y = 4; f2.castShadow = true; g.add(f2);
      g.position.set(x, 0, z); scene.add(g);
      colliders.push({ x: x, z: z, r: 0.9 });
      return g;
    }
    function house(x, z, rot, w, wallC, roofC) {
      const g = new THREE.Group();
      const bh = 3;
      const walls = box(w, bh, w * 0.8, M(wallC)); walls.position.y = bh / 2; g.add(walls);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.85, 1.8, 4), M(roofC));
      roof.position.y = bh + 0.9; roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
      const door = box(0.9, 1.6, 0.1, M(0x5a3b22)); door.position.set(0, 0.8, w * 0.4 + 0.02); g.add(door);
      const win = box(0.7, 0.7, 0.1, M(0xbfe0ef, 0.3, 0.2));
      win.position.set(-w * 0.25, 1.8, w * 0.4 + 0.02); g.add(win);
      const win2 = win.clone(); win2.position.x = w * 0.25; g.add(win2);
      g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
      colliders.push({ x: x, z: z, r: w * 0.65 });
      return g;
    }

    // dorpshuizen
    house(-12, -10, 0.3, 5, 0xe8d7b0, 0x9a5b43);
    house(12, -12, -0.2, 5, 0xdfcfa6, 0x7a5b8a);
    house(-16, 4, 0.5, 4.5, 0xe3d3ac, 0x8a6b43);
    house(15, 2, -0.4, 4.5, 0xe8dcbf, 0x6b7a8a);
    [[-22, -18], [22, -20], [-25, 12], [26, 10], [-8, -24], [9, -26], [0, -34], [-30, -4], [30, -2]].forEach((p) => tree(p[0], p[1]));

    /* ---- Jeans huis (groter, met bordje) ---- */
    const jeanHouse = new THREE.Group();
    (function () {
      const wc = 0xf2e6c8, w = 7, bh = 4;
      const walls = box(w, bh, w * 0.8, M(wc)); walls.position.y = bh / 2; jeanHouse.add(walls);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.8, 2.6, 4), M(0x7a3b2a)); roof.position.y = bh + 1.3; roof.rotation.y = Math.PI / 4; roof.castShadow = true; jeanHouse.add(roof);
      const door = box(1.2, 2.2, 0.15, M(0x5a3b22)); door.position.set(0, 1.1, w * 0.4 + 0.02); jeanHouse.add(door);
      [-1.9, 1.9].forEach((wx) => { const win = box(1, 1.1, 0.12, M(0xbfe0ef, 0.3, 0.2)); win.position.set(wx, 2.4, w * 0.4 + 0.02); jeanHouse.add(win); });
    })();
    jeanHouse.position.set(0, 0, -5);
    scene.add(jeanHouse);
    colliders.push({ x: 0, z: -5, r: 4.6 });
    tree(-5.5, 6); tree(5.5, 6); tree(-7, -1); tree(7, -1);

    /* ---- interactieve objecten ---- */
    const interactives = [];
    function makeMarker(found) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 128;
      const ctx = cv.getContext("2d");
      ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2);
      ctx.fillStyle = found ? "#3f8f52" : "#c79a3b"; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = "#fff"; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 78px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(found ? "✓" : "?", 64, 70);
      const tex = new THREE.CanvasTexture(cv);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true }));
      spr.scale.set(1.3, 1.3, 1.3);
      return spr;
    }
    function addInteractive(id, mesh, markerY, card, collideR) {
      mesh.traverse((c) => { c.userData.iid = id; });
      mesh.userData.iid = id;
      const found = api.isFound(id);
      const marker = makeMarker(found);
      marker.position.set(mesh.position.x, markerY, mesh.position.z);
      marker.userData.baseY = markerY;
      scene.add(marker);
      interactives.push({ id: id, mesh: mesh, marker: marker, card: card, found: found });
      if (collideR) colliders.push({ x: mesh.position.x, z: mesh.position.z, r: collideR });
    }

    // huis = geboortehuis
    addInteractive("huis", jeanHouse, 7.6, { emoji: "🏠", title: "Het geboortehuis", fr: "la maison natale", text: "Jean de La Fontaine werd geboren in <strong>1621</strong> in <strong>Château-Thierry</strong>. Dit is zijn geboortehuis." });

    // lessenaar met weegschaal (rechten)
    const lectern = new THREE.Group();
    (function () {
      const post = box(0.4, 1.2, 0.4, M(0x6b4a2a)); post.position.y = 0.6; lectern.add(post);
      const top = box(1.2, 0.15, 0.8, M(0x8a5b2a)); top.position.y = 1.3; top.rotation.x = -0.3; lectern.add(top);
      const beam = box(0.9, 0.06, 0.06, M(0xd9b44a, 0.4, 0.6)); beam.position.y = 1.9; lectern.add(beam);
      [-0.4, 0.4].forEach((sx) => { const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.1, 12), M(0xd9b44a, 0.4, 0.6)); pan.position.set(sx, 1.7, 0); lectern.add(pan); });
    })();
    lectern.position.set(-6, 0, 2); scene.add(lectern);
    addInteractive("droit", lectern, 2.4, { emoji: "⚖️", title: "De rechtenstudie", fr: "le droit", text: "Op wens van zijn vader studeerde Jean <strong>rechten</strong> (le droit) voordat hij schrijver werd." }, 0.7);

    // Ésope-scroll op een zuil
    const column = new THREE.Group();
    (function () {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2, 16), M(0xded3b5)); col.position.y = 1; col.castShadow = true; column.add(col);
      const scroll = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1, 12), M(0xf3e6c0)); scroll.rotation.z = Math.PI / 2; scroll.position.y = 2.2; scroll.castShadow = true; column.add(scroll);
    })();
    column.position.set(6, 0, 2); scene.add(column);
    addInteractive("esope", column, 3, { emoji: "📜", title: "De oude Griek Ésope", fr: "la fable", text: "De Griek <strong>Ésope</strong> (Aesopus) schreef lang geleden al fabels. Jean gaf ze nieuw leven in het Frans." }, 0.7);

    // Fables-boek op standaard
    const bookStand = new THREE.Group();
    (function () {
      const table = box(1.4, 0.15, 1, M(0x6b4a2a)); table.position.y = 1; bookStand.add(table);
      [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]].forEach((p) => { const leg = box(0.12, 1, 0.12, M(0x5a3b22)); leg.position.set(p[0], 0.5, p[1]); bookStand.add(leg); });
      const book = box(1, 0.2, 0.7, M(0x9c2b3a)); book.position.y = 1.18; book.rotation.x = -0.15; bookStand.add(book);
      const pages = box(0.9, 0.16, 0.6, M(0xfaf3df)); pages.position.y = 1.2; pages.rotation.x = -0.15; bookStand.add(pages);
    })();
    bookStand.position.set(-4, 0, -14); scene.add(bookStand);
    addInteractive("fables", bookStand, 2.2, { emoji: "📚", title: "De Fables (1668)", fr: "les Fables", text: "In <strong>1668</strong> verscheen Jeans beroemde bundel <strong>Fables</strong> — met dieren die wijze lessen geven." }, 0.8);

    // Académie-monument
    const monument = new THREE.Group();
    (function () {
      const base = box(1.6, 0.6, 1.6, M(0xcfc3a3)); base.position.y = 0.3; monument.add(base);
      const ped = box(1, 2, 1, M(0xe0d5b6)); ped.position.y = 1.6; monument.add(ped);
      const bust = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), M(0xbfb290)); bust.position.y = 3; bust.castShadow = true; monument.add(bust);
    })();
    monument.position.set(5, 0, -16); scene.add(monument);
    addInteractive("academie", monument, 4, { emoji: "🏛️", title: "De Académie française", fr: "l'Académie française", text: "In <strong>1684</strong> werd Jean lid van de <strong>Académie française</strong> — de hoogste eer voor een Frans schrijver." }, 0.9);

    /* ---- speler & besturing ---- */
    const player = { x: 0, z: 12, yaw: 0, pitch: 0.02, eye: 1.7 };
    const move = { fwd: false, back: false, left: false, right: false };
    const keys = {};
    function kd(e) {
      keys[e.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].indexOf(e.code) >= 0) e.preventDefault();
    }
    function ku(e) { keys[e.code] = false; }
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    // muis-sleep om rond te kijken
    let dragging = false, lastX = 0, lastY = 0, moved = false;
    const el = renderer.domElement;
    el.addEventListener("mousedown", (e) => { dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY; el.style.cursor = "grabbing"; });
    window.addEventListener("mouseup", () => { dragging = false; el.style.cursor = "grab"; });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      player.yaw -= dx * 0.005;
      player.pitch = Math.max(-0.55, Math.min(0.4, player.pitch - dy * 0.005));
    });
    // touch: één vinger = kijken
    el.addEventListener("touchstart", (e) => { const t = e.touches[0]; dragging = true; moved = false; lastX = t.clientX; lastY = t.clientY; }, { passive: true });
    el.addEventListener("touchmove", (e) => { const t = e.touches[0]; const dx = t.clientX - lastX, dy = t.clientY - lastY; lastX = t.clientX; lastY = t.clientY; if (Math.abs(dx) + Math.abs(dy) > 4) moved = true; player.yaw -= dx * 0.006; player.pitch = Math.max(-0.55, Math.min(0.4, player.pitch - dy * 0.006)); }, { passive: true });
    el.addEventListener("touchend", () => { dragging = false; });

    // klik = object aanraken
    const ray = new THREE.Raycaster();
    el.addEventListener("click", (e) => {
      if (moved) return;
      const rect = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(interactives.map((o) => o.mesh), true)[0];
      if (!hit) return;
      let o = hit.object; while (o && o.userData.iid === undefined) o = o.parent;
      if (!o) return;
      const it = interactives.find((x) => x.id === o.userData.iid);
      if (!it) return;
      if (!it.found) { it.found = true; it.marker.material.map = makeMarker(true).material.map; it.marker.material.needsUpdate = true; }
      api.onFind(it.id, it.card, interactives.filter((x) => x.found).length, interactives.length);
    });

    /* ---- publieke besturing (voor schermknoppen) ---- */
    function press(name, down) { if (name in move) move[name] = down; }

    /* ---- lus ---- */
    let raf = null; const clock = new THREE.Clock();
    function frame() {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      const fwd = (keys.KeyW || keys.ArrowUp || move.fwd ? 1 : 0) - (keys.KeyS || keys.ArrowDown || move.back ? 1 : 0);
      const strafe = (keys.KeyD || keys.ArrowRight || move.right ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || move.left ? 1 : 0);
      if (fwd || strafe) {
        const s = 7 * dt, sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
        let nx = player.x + (cy * strafe - sy * fwd) * s;
        let nz = player.z + (-sy * strafe - cy * fwd) * s;
        // botsingen
        let blocked = false;
        for (let i = 0; i < colliders.length; i++) {
          const c = colliders[i], ddx = nx - c.x, ddz = nz - c.z;
          if (ddx * ddx + ddz * ddz < (c.r + 0.6) * (c.r + 0.6)) { blocked = true; break; }
        }
        if (!blocked) {
          player.x = Math.max(-58, Math.min(58, nx));
          player.z = Math.max(-58, Math.min(58, nz));
        }
      }
      camera.position.set(player.x, player.eye, player.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch;
      const t = Date.now() * 0.003;
      interactives.forEach((o) => { o.marker.position.y = o.marker.userData.baseY + 0.25 + Math.sin(t + o.mesh.position.x) * 0.18; });
      renderer.render(scene, camera);
    }
    frame();

    function onResize() { renderer.setSize(getW(), getH()); camera.aspect = getW() / getH(); camera.updateProjectionMatrix(); }
    window.addEventListener("resize", onResize);

    function dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.parentNode) el.parentNode.removeChild(el);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); } });
    }

    return { dispose: dispose, press: press, total: interactives.length };
  }
})();
