import {ElementRef, Injectable, NgZone} from '@angular/core';
import * as THREE from 'three';

import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Vector3,
} from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {SVGLine} from "../classes/svgline";
import {LSystemCalculator} from "../classes/lsystem-calculator";

@Injectable({
  providedIn: 'root'
})
export class ThreeJSRenderService {


  private canvas: HTMLCanvasElement | undefined = undefined;
  private renderer: THREE.WebGLRenderer | undefined = undefined;
  private camera: THREE.PerspectiveCamera | undefined = undefined;
  private scene: THREE.Scene | undefined = undefined;

  private frameId: number = 0;
  private controls: OrbitControls | undefined = undefined;

  public constructor(private ngZone: NgZone) {
  }

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    // https://threejs.org/docs/index.html?q=pointlight#api/en/lights/shadows/PointLightShadow
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    this.renderer.setSize(canvas.nativeElement.width, canvas.nativeElement.height);
    // create the scene
    this.scene = new THREE.Scene();

    this.setupCamera();
    this.setupLights();
    this.setupShapes();
    this.renderer.setAnimationLoop(() => {
      this.animate();
    })
  }

  setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.resize();
    });
    window.addEventListener('DOMContentLoaded', () => {
      this.render();
    });
  }

  setupCamera(): void {

    if (this.canvas) {
      this.camera = new THREE.PerspectiveCamera(
        25, this.canvas.clientWidth / this.canvas.height, 0.1, 12000
      );
      this.camera.position.set(0, 0, -500);
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
      this.camera.updateProjectionMatrix();
      if (this.scene) {
        this.scene.add(this.camera);
      }
      this.setOrbitControls();
    }
  }

  setupLights(): void {
    // soft white light
    const light1 = new THREE.PointLight(0xffffff, 3, 12000);
    light1.position.set(50, 250, 100);

    if (this.scene) {
      this.scene.add(light1);
    }

  }

  setupShapes(): void {
    this.createFloorPlane();
  }

  createShapes(lsystem: LSystemCalculator): void {


    if (this.scene && this.renderer && lsystem.lines) {

      this.scene.clear();

      this.createFloorPlane()

      lsystem.lines.forEach((line: SVGLine) => {
        const newPoint1 = new THREE.Vector3(line.x1, line.y1, 0);
        const newPoint2 = new THREE.Vector3(line.x2, line.y2, 0);
        const geometry = new THREE.BufferGeometry().setFromPoints([newPoint1, newPoint2]);

        const material = new THREE.LineBasicMaterial({
          color: lsystem.strokeColor,
          linewidth: 2,
          linejoin: 'round',
          linecap: 'butt',
          opacity: line.strokeOpacity,
          transparent: true
        });
        material.opacity = line.strokeOpacity;

        const lineObject = new THREE.Line(geometry, material);
        if (this.scene) {
          this.scene.add(lineObject);
        }
      });

    }
  }// createShapes

  createFloorPlane(): void {
    const linematerialX = new LineBasicMaterial({color: 'black'});
    const linematerialY = new LineBasicMaterial({color: 'blue'});
    const linematerialZ = new LineBasicMaterial({color: 'red'});

    const pointsX = [new Vector3(0, 0, 0), new Vector3(130, 0, 0)];
    const pointsY = [new Vector3(0, 0, 0), new Vector3(0, 130, 0)];
    const pointsZ = [new Vector3(0, 0, 0), new Vector3(0, 0, 130)];

    const linex = new Line(new BufferGeometry().setFromPoints(pointsX), linematerialX);
    const liney = new Line(new BufferGeometry().setFromPoints(pointsY), linematerialY);
    const linez = new Line(new BufferGeometry().setFromPoints(pointsZ), linematerialZ);
    this.scene?.add(linex);
    this.scene?.add(liney);
    this.scene?.add(linez);
  }// createFloorPlane

  setOrbitControls(): void {
    if (this.camera && this.renderer) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.minDistance = 1;
      this.controls.maxDistance = 8000;

      //this.controls.enableDamping = true;
      //this.controls.dampingFactor = 0.5;

      // this.controls.screenSpacePanning = false;
      this.controls.maxPolarAngle = Math.PI;
    }
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    if (!this) {
      console.log(`no this`);
      return;
    }
    if (!this.ngZone) {
      console.log(`no this.ngZone`);
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
        console.log(this.camera?.position);
      }
    });
  }

  public render(): void {
    if (this.controls && this.renderer && this.scene && this.camera) {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  public resize(): void {
    if (this.renderer && this.camera) {
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.render();
    }
  }

}
