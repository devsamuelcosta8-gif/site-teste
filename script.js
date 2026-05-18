document.addEventListener("DOMContentLoaded", () => {
    
    gsap.registerPlugin(ScrollTrigger);

    /* =====================================================
       DETECÇÃO DE DISPOSITIVO
    ===================================================== */
    let isMobile = window.innerWidth <= 900;

    /* =====================================================
       1. SETUP THREE.JS
    ===================================================== */
    const canvas = document.querySelector('#webgl-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    /* =====================================================
       2. LUZES
    ===================================================== */
    scene.add(new THREE.AmbientLight('#ffffff', 0.8));
    const cyanLight = new THREE.PointLight('#06b6d4', 5, 30);
    cyanLight.position.set(5, 3, 5);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight('#a855f7', 5, 30);
    purpleLight.position.set(-5, 2, 5);
    scene.add(purpleLight);

    /* =====================================================
       3. CARREGAMENTO COM SPLASH
    ===================================================== */
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);
    let brain = null;

    const splashScreen = document.getElementById('splash-screen');
    const progressBarFill = document.getElementById('progress-bar-fill');

    const manager = new THREE.LoadingManager();
    manager.onProgress = (url, loaded, total) => {
        if (progressBarFill) progressBarFill.style.width = `${(loaded / total) * 100}%`;
    };

    manager.onLoad = () => {
        gsap.to(splashScreen, {
            opacity: 0, duration: 1, delay: 0.5,
            onComplete: () => {
                splashScreen.style.display = 'none';
                initAnimations();

                if (isMobile) {
                    const hint = document.getElementById('touch-hint');
                    if (hint) hint.style.display = 'block';
                }
            }
        });
    };

    const loader = new THREE.GLTFLoader(manager);
    loader.load('./human_brain.glb', (gltf) => {
        brain = gltf.scene;

        // ESCALA DO MODELO POR DISPOSITIVO (Impede de amassar)
        if (isMobile) {
            brain.scale.set(0.48, 0.48, 0.48); // Tamanho ideal e redondo para o mobile
        } else {
            brain.scale.set(0.8, 0.8, 0.8);    // Tamanho original para desktop
        }

        brain.traverse((child) => {
            if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = 0.9;
                child.material.roughness = 0.5;
                if (child.material.map) {
                    child.material.map.encoding = THREE.sRGBEncoding;
                }
            }
        });

        brainGroup.add(brain);

        // POSIÇÃO DO GRUPO POR DISPOSITIVO
        if (isMobile) {
            brainGroup.position.set(0, -1.0, 0); // Perfeitamente centralizado no vão preto
        } else {
            brainGroup.position.set(0, -5, 0);   
        }
    });

    /* =====================================================
       4. ANIMAÇÕES — DESKTOP
    ===================================================== */
    function initDesktopAnimations() {
        gsap.utils.toArray('.fade-up').forEach((elem) => {
            gsap.from(elem, {
                scrollTrigger: { trigger: elem, start: 'top 85%' },
                y: 40, opacity: 0, duration: 1
            });
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "main",
                start: "top top",
                endTrigger: "#sobre",
                end: "top center",
                scrub: 1.5
            }
        });

        tl
            .to(brainGroup.position, { x: 2.2, y: 0, z: 0 }, 0)
            .to(brainGroup.rotation, { y: Math.PI }, 0)
            .to(brainGroup.position, { x: -2.2, y: -0.5 }, 0.5)
            .to(brainGroup.rotation, { y: Math.PI * 1.5 }, 0.5)
            .to(brainGroup.position, { x: 0, y: -0.5 }, 1)
            .to(brainGroup.rotation, { y: Math.PI * 2 }, 1);

        ScrollTrigger.create({
            trigger: "#sobre",
            start: "top 70%",
            end: "top 20%",
            scrub: true,
            onUpdate: (self) => {
                if (!brain) return;
                brain.traverse((child) => {
                    if (child.isMesh) child.material.opacity = 0.9 * (1 - self.progress);
                });
            },
            onLeaveBack: () => {
                if (!brain) return;
                brain.traverse((child) => {
                    if (child.isMesh) child.material.opacity = 0.9;
                });
            }
        });
    }

    /* =====================================================
       4. ANIMAÇÕES — MOBILE
    ===================================================== */
    function initMobileAnimations() {
        gsap.utils.toArray('.fade-up').forEach((elem) => {
            gsap.from(elem, {
                scrollTrigger: { trigger: elem, start: 'top 85%' },
                y: 40, opacity: 0, duration: 1
            });
        });

        // Fade-out suave ao rolar a página para baixo no mobile
        ScrollTrigger.create({
            trigger: "main",
            start: "top top",
            end: "20% top",
            scrub: true,
            onUpdate: (self) => {
                if (!brain) return;
                brain.traverse((child) => {
                    if (child.isMesh) child.material.opacity = 0.9 * (1 - self.progress);
                });
            },
            onLeaveBack: () => {
                if (!brain) return;
                brain.traverse((child) => {
                    if (child.isMesh) child.material.opacity = 0.9;
                });
            }
        });
    }

    /* =====================================================
       DISPATCHER
    ===================================================== */
    function initAnimations() {
        if (isMobile) {
            initMobileAnimations();
        } else {
            initDesktopAnimations();
        }
    }

    /* =====================================================
       TOUCH DRAG — MOBILE
    ===================================================== */
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging  = false;
    const DRAG_SENSITIVITY = 0.008;

    document.addEventListener('touchstart', (e) => {
        if (!isMobile || !brain) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isDragging  = false;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isMobile || !brain) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        if (!isDragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
            isDragging = true;
        }

        if (isDragging) {
            brainGroup.rotation.y += dx * DRAG_SENSITIVITY;
            touchStartX = e.touches[0].clientX;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        isDragging = false;
    }, { passive: true });

    /* =====================================================
       5. LOOP DE RENDERIZAÇÃO
    ===================================================== */
    function animate() {
        requestAnimationFrame(animate);
        if (brain) {
            brain.position.y = Math.sin(Date.now() * 0.0015) * 0.1;
            if (!isMobile) {
                brain.rotation.y += 0.002;
            }
        }
        renderer.render(scene, camera);
    }
    animate();

    /* =====================================================
       RESIZE
    ===================================================== */
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 900;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (brain) {
            if (isMobile) {
                brain.scale.set(0.48, 0.48, 0.48);
            } else {
                brain.scale.set(0.8, 0.8, 0.8);
            }
        }
        ScrollTrigger.refresh();
    });

});
