import * as THREE from "three";
import "fpsmeter";

// 350,000
const n = 300000;
let t = 0;

class Engine {
  constructor() {
    this.content = document.querySelector("body");
    this.meterContainer = this.content.querySelector(".meter");
    this.countLinks = this.content.querySelectorAll(".count-selector > a");

    this.width = Math.min(this.content.clientWidth, 2500);
    this.height = 1200;
    this.count;

    this.initFpsmeter();
    this.initSettings();

    this.initMenuLink();

    const cancelAnimationFrameObj = (
      window.cancelAnimationFrame ||
      window.webkitCancelRequestAnimationFrame ||
      window.mozCancelRequestAnimationFrame ||
      window.oCancelRequestAnimationFrame ||
      window.msCancelRequestAnimationFrame
    );

    this.cancelAnimationFrame = cancelAnimationFrameObj
      ? cancelAnimationFrameObj.bind(window) || clearTimeout
      : clearTimeout;
  }

  initFpsmeter() {
    this.meter = new window.FPSMeter(this.meterContainer, {
      graph: 1,
      heat: 1,
      theme: "light",
      history: 25,
      top: 0,
      bottom: 40,
      left: `calc(${this.width}px + 2.5em)`,
      transform: "translateX(-100%)",
    });
  }

  initSettings() {
    const count = JSON.parse(localStorage.getItem("count"));

    this.count = count || { index: 1, value: 1000 };
    localStorage.setItem("count", JSON.stringify(this.count));

    this.countLinks.forEach((link, index) => {
      this.countLinks[this.count.index].classList.toggle("selected", true);

      link.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        this.countLinks[this.count.index].classList.toggle("selected", false);
        this.count = { index: index, value: parseInt(link.innerText) };
        this.countLinks[this.count.index].classList.toggle("selected", true);

        localStorage.setItem("count", JSON.stringify(this.count));

        this.render();
      });
    });
  }

  initMenuLink() {
    const menuLinks = document.querySelectorAll("header > menu > a");
    const { href } = window.location;

    [...menuLinks].forEach((ml) => {
      if (ml.href === href) {
        ml.classList.add("disabled");
      }
    });
  }

  render() {}
}

class ThreeEngine extends Engine {
  constructor() {
    super();
    this.camera = new THREE.OrthographicCamera(
      - this.width / 2,
      this.width / 2,
      this.height / 2,
      - this.height / 2,
      1,
      1000
    );
    this.camera.position.set(this.width / 2, this.height / 2, 500);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      depth: false,
      precision: "lowp",
    })
    this.renderer.setSize(this.width, this.height);
    this.renderer.sortObjects = false; // Allows squares to be drawn on top of each other
    this.content.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color("white");

    this._tempVec = new THREE.Vector3();
	this._tempMat0 = new THREE.Matrix4();
	this._tempMat1 = new THREE.Matrix4().makeTranslation(new THREE.Vector3(-1, 0, 0));

    this.dummy = new THREE.Object3D();
    this.geometry = new THREE.PlaneGeometry(3, 3);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xfff000,
      side: THREE.FrontSide,
      depthTest: false,
    });
    this.instancedPlane = new THREE.InstancedMesh(this.geometry, this.material, n);
    this.scene.add(this.instancedPlane);
  }

  animate() {

    t += .01;

	for ( var i = 0; i < n; i ++ ) {

		this.instancedPlane.getMatrixAt(i, this._tempMat0);
		this._tempVec.setFromMatrixPosition(this._tempMat0);

		if (this._tempVec.x < 0) {
			this.dummy.position.set(2500, this._tempVec.y, 0);
			this._tempVec.setFromMatrixScale(this._tempMat0);
			this.dummy.scale.set(this._tempVec.x, this._tempVec.y, 1);
			this.dummy.updateMatrix();
			this.instancedPlane.setMatrixAt( i, this.dummy.matrix );
		} else {
			this._tempMat0.multiply(this._tempMat1);2
			this.instancedPlane.setMatrixAt( i, this._tempMat0 );
		}
	  }

    this.instancedPlane.instanceMatrix.needsUpdate = true;

    this.lastFrame = requestAnimationFrame(
      this.animate.bind(this),
      this.renderer.domElement
    );

    this.material.color.setRGB(Math.sin(t), Math.sin( 1 - t ), Math.sin(t*2) );
    this.renderer.render(this.scene, this.camera);
    this.meter.tick();
  }

  render() {

     for ( var i = 0; i < n; i ++ ) {
      this._tempVec.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);
  		this.dummy.position.set(Math.random() * 2500, Math.random() * 1200, 0);
		this.dummy.scale.set(Math.random(), Math.random(), 1.0);
  		this.dummy.updateMatrix();
      this.instancedPlane.setMatrixAt( i, this.dummy.matrix );
    }

    if (this.lastFrame) {
      // Avoid overlapping animation requests to keep FPS meter working
      cancelAnimationFrame(this.lastFrame);
    }

    this.animate();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const engine = new ThreeEngine();
  engine.render();
});