import {ElementRef, Injectable, NgZone} from '@angular/core';
import * as THREE from 'three';

import {
  BufferGeometry, CatmullRomCurve3, Group,
  Line,
  LineBasicMaterial, Mesh, MeshLambertMaterial, TubeGeometry,
  Vector3,
} from 'three';
import {SVGLine} from "../classes/svgline";
import {LSystemCalculator} from "../classes/lsystem-calculator";
import {CarthesianCoordinates2d} from "../classes/carthesian-coordinates2d";
import {OrbitControls} from "../treejs-copies/OrbitControls";
import {Reflector} from "../treejs-copies/Reflector";

@Injectable({
  providedIn: 'root'
})
export class ThreeJSRenderService {


  private canvas: HTMLCanvasElement | undefined = undefined;
  private renderer: THREE.WebGLRenderer | undefined = undefined;
  private camera: THREE.PerspectiveCamera | undefined = undefined;
  private scene: THREE.Scene | undefined = undefined;
  private light1 = new THREE.DirectionalLight;

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
    // The first step is to get the reference of the coordinateSystem2d element from our HTML document
    this.canvas = canvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,    // transparent background
      antialias: true // smooth edges
    });
    // https://threejs.org/docs/index.html?q=pointlight#api/en/lights/shadows/PointLightShadow
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    this.renderer.setSize(canvas.nativeElement.width, canvas.nativeElement.height);
    // create the scene
    this.scene = new THREE.Scene();

    this.setupCamera();
    this.setupLights();
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
      this.resetCameraPosition();
      if (this.scene) {
        this.scene.add(this.camera);
      }
      this.setOrbitControls();
    }
  }

  setupLights(): void {
    // soft white light
    this.light1 = new THREE.DirectionalLight(0xffffff, 3);
    this.light1.position.set(0, 600, -600);
    this.light1.castShadow = true;
    this.light1.shadow.mapSize.width = 2048;
    this.light1.shadow.mapSize.height = 2048;
    this.light1.shadow.camera.near = 0.5;
    this.light1.shadow.camera.far = 1200;

    const shadowCameraFrustrumSize = 500;

    this.light1.shadow.camera.left = -shadowCameraFrustrumSize;
    this.light1.shadow.camera.right = shadowCameraFrustrumSize;
    this.light1.shadow.camera.top = shadowCameraFrustrumSize;
    this.light1.shadow.camera.bottom = -shadowCameraFrustrumSize;

    const light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(0, 0, -500);
    light2.lookAt(0, 1, 0);

    // const helper = new THREE.CameraHelper(this.light1.shadow.camera);

    if (this.scene) {
      this.scene.add(this.light1);
      this.scene.add(light2);
      // this.scene.add(helper);
    }
  }

  resetCameraPosition(): void {
    if (this.camera) {
      this.camera.position.set(0, 10, -500);
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
      this.camera.updateProjectionMatrix();
    }
  }

  setupShapes(): void {

  }

  createShapes(lsystem: LSystemCalculator): void {

    if (this.scene && this.renderer && lsystem.lines) {

      this.scene.clear();

      this.setupLights();
      this.createFloorPlane(false, true, false);

      lsystem.lines.forEach((line: SVGLine) => {
        const newPoint1 = new THREE.Vector3(line.x1 + lsystem.OriginCoordinates3d.x, line.y1 + lsystem.OriginCoordinates3d.y, lsystem.OriginCoordinates3d.z);
        const newPoint2 = new THREE.Vector3(line.x2 + lsystem.OriginCoordinates3d.x, line.y2 + lsystem.OriginCoordinates3d.y, lsystem.OriginCoordinates3d.z);
        const lineObject = this.createShadowCastingLine(newPoint1, newPoint2, line.strokeWidth, lsystem.strokeColor, line.strokeOpacity);
        if (this.scene) {
          this.scene.add(lineObject);
        }
      });

    }
  }// createShapes

  createShadowCastingLine(start: Vector3, end: Vector3, radius: number, color: string, opacity: number): Group {

    const curve = new CatmullRomCurve3([start, end], false);
    const group = new Group();

    const geometry = new TubeGeometry(
      curve,
      1,
      radius,
      6,
      false
    );
    const linematerial = new THREE.MeshPhysicalMaterial({
      color: color,
      reflectivity: 1,
      opacity: opacity,
      transparent: true,

    });
    const line = new Mesh(geometry, linematerial);
    line.castShadow = true;
    line.receiveShadow = false;

    group.add(line);

    return group;
  }// createShadowCastingLine


  createFloorPlane(addLines: boolean, addPlane: boolean, addMirror: boolean): void {
    if (addLines) {
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
    }

    if (addPlane) {

      //Create a plane that receives shadows (but does not cast them)
      const planeHeight = 10;
      let planeGeometry = new THREE.BoxGeometry(1000, 1000, planeHeight, 1, 1, 1);
      let planeMaterial = new THREE.MeshStandardMaterial({color: 'whitesmoke'})
      let plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.receiveShadow = true;
      planeGeometry.rotateX(-Math.PI / 2);
      plane.position.set(0, -planeHeight / 2, 0);
      this.scene?.add(plane);
    }
    if (addMirror) {
            let mirrorGeometry = new THREE.PlaneGeometry(1000, 500,1, 1);
            const groundMirror = new Reflector(mirrorGeometry, {
              clipBias: 0.003,
              textureWidth: window.innerWidth * window.devicePixelRatio,
              textureHeight: window.innerHeight * window.devicePixelRatio,
              color: 'whitesmoke',

            });
            groundMirror.position.y = 250;
            groundMirror.position.z = 500;
            groundMirror.rotateY(Math.PI);

            this.scene?.add(groundMirror);
    }
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
