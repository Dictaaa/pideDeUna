import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, inject, signal, afterNextRender } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlanService } from '../../../../core/services/super-admin.service';
import { Plan } from '../../../../core/models/company.model';
import { Skeleton } from '../../../../shared/components/skeleton/skeleton';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface FeatureBlock {
  icon: string;
  title: string;
  description: string;
}

interface StepBlock {
  n: string;
  title: string;
  desc: string;
}

const FEATURES: FeatureBlock[] = [
  {
    icon: '📱',
    title: 'Menú digital por QR',
    description: 'Tu cliente escanea el código de la mesa y ve el menú completo — fotos, video, ingredientes y alérgenos incluidos.',
  },
  {
    icon: '🧾',
    title: 'Pedidos en tiempo real',
    description: 'La mesera arma el pedido desde su celular y cocina lo ve aparecer al instante, con un solo botón para avanzarlo.',
  },
  {
    icon: '👥',
    title: 'Un panel por rol',
    description: 'Cada quien ve solo lo suyo — mesera, cocina y administrador tienen su propia pantalla, sin estorbarse.',
  },
  {
    icon: '📊',
    title: 'Estadísticas reales',
    description: 'Cuántos pedidos, cuánto vendiste, qué se vende más — por día, semana, mes o año.',
  },
];

const STEPS: StepBlock[] = [
  { n: '1', title: 'Crea tu menú', desc: 'Agrega productos, precios, fotos y video en minutos.' },
  { n: '2', title: 'Pega tu QR', desc: 'En cada mesa, en la barra, donde haga falta.' },
  { n: '3', title: 'El cliente explora', desc: 'Ve fotos, precios y arma su pedido desde el celular.' },
  { n: '4', title: 'Te llega a cocina', desc: 'El pedido aparece al instante, sin que nadie tenga que ir y venir.' },
];

// No hay registro público — el equipo de PideDeUna crea cada
// compañía a mano después de hablar contigo. Todos los "empezar"
// de esta página apuntan acá, no a un formulario de registro.
const WHATSAPP_URL = 'https://wa.me/573154789845';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe, Skeleton],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  host: { ngSkipHydration: 'true' },
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('webgl') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private planService = inject(PlanService);

  features = FEATURES;
  steps = STEPS;
  whatsappUrl = WHATSAPP_URL;
  loadingPlans = signal(true);
  plans = signal<Plan[]>([]);

  private revealObserver?: IntersectionObserver;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private dishGroup: THREE.Object3D | null = null;
  private frameId = 0;

  // Rotación por arrastre — el modelo no se mueve solo, solo gira
  // mientras mantienes el clic apretado sobre el canvas.
  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private rotationY = 0;
  private rotationX = 0;

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.lastPointerX;
    const deltaY = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.rotationY += deltaX * 0.01;
    this.rotationX += deltaY * 0.01;
  };

  private readonly onPointerUp = (): void => {
    this.isDragging = false;
  };

  private readonly onResize = (): void => {
    const canvas = this.canvasRef?.nativeElement;
    if (!this.renderer || !this.camera || !canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return; // tamaño inválido momentáneo — ignóralo, no rompas la cámara
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private setupRevealObserver(): void {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.revealObserver?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );
    this.observeRevealElements();
  }

  private observeRevealElements(): void {
    if (!this.revealObserver) return;
    document.querySelectorAll('.reveal:not(.is-observed)').forEach((el) => {
      el.classList.add('is-observed');
      this.revealObserver!.observe(el);
    });
  }

  constructor() {
    afterNextRender(() => this.setupRevealObserver());
    this.planService.list().subscribe({
      next: (plans) => {
        this.plans.set(plans.filter((p) => p.isActive));
        this.loadingPlans.set(false);
        setTimeout(() => this.observeRevealElements(), 0);
      },
      error: () => this.loadingPlans.set(false),
    });
  }

  ngAfterViewInit(): void {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.startScene();
    }
  }

  private startScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) {
      requestAnimationFrame(() => this.startScene());
      return;
    }
    this.initScene();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onResize);
    this.revealObserver?.disconnect();
    this.renderer?.dispose();
  }

  private initScene(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);

    this.scene.add(new THREE.HemisphereLight(0xffe7c1, 0x100805, 2));
    const keyLight = new THREE.PointLight(0xff9a19, 80, 30);
    keyLight.position.set(2, 4, 4);
    this.scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xffd38a, 35, 20);
    fillLight.position.set(-4, 2, 3);
    this.scene.add(fillLight);

    this.dishGroup = this.buildPlaceholderDish();
    this.scene.add(this.dishGroup);

    const loader = new GLTFLoader();
    loader.load(
      '/models/ramen-store.glb',
      (gltf) => {
        if (this.dishGroup) this.scene!.remove(this.dishGroup);
        this.dishGroup = gltf.scene;

        const box = new THREE.Box3().setFromObject(this.dishGroup);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const targetSize = 3.5;
        const scale = targetSize / maxDim;
        this.dishGroup.scale.setScalar(scale);
        this.dishGroup.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

        this.scene!.add(this.dishGroup);
      },
      undefined,
      (err) => console.error('No se pudo cargar el modelo del puesto de ramen:', err)
    );

    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', this.onResize);

    const animate = (): void => {
      this.frameId = requestAnimationFrame(animate);
      if (this.dishGroup) {
        this.dishGroup.rotation.y = this.rotationY;
        this.dishGroup.rotation.x = this.rotationX;
      }
      this.renderer!.render(this.scene!, this.camera!);
    };
    animate();
  }

  private buildPlaceholderDish(): THREE.Group {
    const group = new THREE.Group();

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 1.85, 0.16, 96),
      new THREE.MeshPhysicalMaterial({ color: 0xf4f0e8, roughness: 0.2, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 })
    );
    group.add(plate);

    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(1.65, 1.5, 0.08, 96),
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.28 })
    );
    inner.position.y = 0.11;
    group.add(inner);

    const foodMaterial = new THREE.MeshPhysicalMaterial({ color: 0xd97920, roughness: 0.5, clearcoat: 0.25 });
    for (let i = 0; i < 28; i++) {
      const size = 0.16 + Math.random() * 0.13;
      const food = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), foodMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.2;
      food.position.set(Math.cos(angle) * radius, 0.28 + Math.random() * 0.25, Math.sin(angle) * radius);
      food.scale.y = 0.6 + Math.random() * 0.5;
      group.add(food);
    }

    const greenMaterial = new THREE.MeshPhysicalMaterial({ color: 0x5f8b35, roughness: 0.6 });
    for (let i = 0; i < 14; i++) {
      const obj = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.08, 20, 20), greenMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 1.15;
      obj.position.set(Math.cos(angle) * radius, 0.45 + Math.random() * 0.15, Math.sin(angle) * radius);
      obj.scale.y = 0.35;
      group.add(obj);
    }

    const sauce = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.025, 12, 80),
      new THREE.MeshBasicMaterial({ color: 0xff8c16 })
    );
    sauce.rotation.x = Math.PI / 2;
    sauce.position.y = 0.45;
    group.add(sauce);

    return group;
  }
}