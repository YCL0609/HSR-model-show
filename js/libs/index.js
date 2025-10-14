// import Ammo from 'ammojs-typed';
import { Object3D, Matrix4, Vector3, Quaternion, MeshBasicMaterial, Color, Mesh, CapsuleGeometry, BoxGeometry, SphereGeometry, Euler, Bone, AnimationMixer, LoaderUtils, Float32BufferAttribute, BufferGeometry, Uint16BufferAttribute, ShaderLib, UniformsUtils, ShaderMaterial, AddOperation, MultiplyOperation, TangentSpaceNormalMap, TextureLoader, RGB_S3TC_DXT1_Format, RGB_PVRTC_4BPPV1_Format, RGB_PVRTC_2BPPV1_Format, RGB_ETC1_Format, RGB_ETC2_Format, SRGBColorSpace, NearestFilter, RepeatWrapping, CustomBlending, SrcAlphaFactor, OneMinusSrcAlphaFactor, DstAlphaFactor, DoubleSide, FrontSide, SkinnedMesh, Skeleton, Loader, FileLoader, AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack, NumberKeyframeTrack, Interpolant } from 'three';
import { CCDIKSolver } from 'three/animation/CCDIKSolver.js';
import { MMDParser } from 'mmd-parser/index.min.js';
import { TGALoader } from 'three/loaders/TGALoader.js';

class Constraint {
  bodyA;
  bodyB;
  constraint;
  manager;
  mesh;
  params;
  world;
  /**
   * @param {import('three').SkinnedMesh} mesh
   * @param {Ammo.btDiscreteDynamicsWorld} world
   * @param {RigidBody} bodyA
   * @param {RigidBody} bodyB
   * @param {object} params
   * @param {ResourceManager} manager
   */
  constructor(mesh, world, bodyA, bodyB, params, manager) {
    this.mesh = mesh;
    this.world = world;
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.params = params;
    this.manager = manager;
    this._init();
  }
  _init() {
    const manager = this.manager;
    const params = this.params;
    const bodyA = this.bodyA;
    const bodyB = this.bodyB;
    const form = manager.allocTransform();
    manager.setIdentity(form);
    manager.setOriginFromArray3(form, params.position);
    manager.setBasisFromArray3(form, params.rotation);
    const formA = manager.allocTransform();
    const formB = manager.allocTransform();
    bodyA.body.getMotionState().getWorldTransform(formA);
    bodyB.body.getMotionState().getWorldTransform(formB);
    const formInverseA = manager.inverseTransform(formA);
    const formInverseB = manager.inverseTransform(formB);
    const formA2 = manager.multiplyTransforms(formInverseA, form);
    const formB2 = manager.multiplyTransforms(formInverseB, form);
    const constraint = new Ammo.btGeneric6DofSpringConstraint(bodyA.body, bodyB.body, formA2, formB2, true);
    const lll = manager.allocVector3();
    const lul = manager.allocVector3();
    const all = manager.allocVector3();
    const aul = manager.allocVector3();
    lll.setValue(params.translationLimitation1[0], params.translationLimitation1[1], params.translationLimitation1[2]);
    lul.setValue(params.translationLimitation2[0], params.translationLimitation2[1], params.translationLimitation2[2]);
    all.setValue(params.rotationLimitation1[0], params.rotationLimitation1[1], params.rotationLimitation1[2]);
    aul.setValue(params.rotationLimitation2[0], params.rotationLimitation2[1], params.rotationLimitation2[2]);
    constraint.setLinearLowerLimit(lll);
    constraint.setLinearUpperLimit(lul);
    constraint.setAngularLowerLimit(all);
    constraint.setAngularUpperLimit(aul);
    for (let i = 0; i < 3; i++) {
      if (params.springPosition[i] !== 0) {
        constraint.enableSpring(i, true);
        constraint.setStiffness(i, params.springPosition[i]);
      }
    }
    for (let i = 0; i < 3; i++) {
      if (params.springRotation[i] !== 0) {
        constraint.enableSpring(i + 3, true);
        constraint.setStiffness(i + 3, params.springRotation[i]);
      }
    }
    if (constraint.setParam !== void 0) {
      for (let i = 0; i < 6; i++) {
        constraint.setParam(2, 0.475, i);
      }
    }
    this.world.addConstraint(constraint, true);
    this.constraint = constraint;
    manager.freeTransform(form);
    manager.freeTransform(formA);
    manager.freeTransform(formB);
    manager.freeTransform(formInverseA);
    manager.freeTransform(formInverseB);
    manager.freeTransform(formA2);
    manager.freeTransform(formB2);
    manager.freeVector3(lll);
    manager.freeVector3(lul);
    manager.freeVector3(all);
    manager.freeVector3(aul);
  }
}

class MMDPhysicsHelper extends Object3D {
  materials;
  physics;
  root;
  _matrixWorldInv = new Matrix4();
  _position = new Vector3();
  _quaternion = new Quaternion();
  _scale = new Vector3();
  /**
   * Visualize Rigid bodies
   */
  constructor(mesh, physics) {
    super();
    this.root = mesh;
    this.physics = physics;
    this.matrix.copy(mesh.matrixWorld);
    this.matrixAutoUpdate = false;
    this.materials = [
      new MeshBasicMaterial({
        color: new Color(16746632),
        depthTest: false,
        depthWrite: false,
        opacity: 0.25,
        transparent: true,
        wireframe: true
      }),
      new MeshBasicMaterial({
        color: new Color(8978312),
        depthTest: false,
        depthWrite: false,
        opacity: 0.25,
        transparent: true,
        wireframe: true
      }),
      new MeshBasicMaterial({
        color: new Color(8947967),
        depthTest: false,
        depthWrite: false,
        opacity: 0.25,
        transparent: true,
        wireframe: true
      })
    ];
    this._init();
  }
  _init() {
    const bodies = this.physics.bodies;
    const createGeometry = (param) => {
      switch (param.shapeType) {
        case 0:
          return new SphereGeometry(param.width, 16, 8);
        case 1:
          return new BoxGeometry(param.width * 2, param.height * 2, param.depth * 2, 8, 8, 8);
        case 2:
          return new CapsuleGeometry(param.width, param.height, 8, 16);
        default:
          return void 0;
      }
    };
    for (let i = 0, il = bodies.length; i < il; i++) {
      const param = bodies[i].params;
      this.add(new Mesh(createGeometry(param), this.materials[param.type]));
    }
  }
  /**
   * Frees the GPU-related resources allocated by this instance. Call this method whenever this instance is no longer used in your app.
   */
  dispose() {
    const materials = this.materials;
    const children = this.children;
    for (let i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if ("isMesh" in child && child.isMesh === true)
        child.geometry.dispose();
    }
  }
  // private method
  /**
   * Updates Rigid Bodies visualization.
   */
  updateMatrixWorld(force) {
    const mesh = this.root;
    if (this.visible) {
      const bodies = this.physics.bodies;
      this._matrixWorldInv.copy(mesh.matrixWorld).decompose(this._position, this._quaternion, this._scale).compose(this._position, this._quaternion, this._scale.set(1, 1, 1)).invert();
      for (let i = 0, il = bodies.length; i < il; i++) {
        const body = bodies[i].body;
        const child = this.children[i];
        const tr = body.getCenterOfMassTransform();
        const origin = tr.getOrigin();
        const rotation = tr.getRotation();
        child.position.set(origin.x(), origin.y(), origin.z()).applyMatrix4(this._matrixWorldInv);
        child.quaternion.setFromRotationMatrix(this._matrixWorldInv).multiply(
          this._quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w())
        );
      }
    }
    this.matrix.copy(mesh.matrixWorld).decompose(this._position, this._quaternion, this._scale).compose(this._position, this._quaternion, this._scale.set(1, 1, 1));
    super.updateMatrixWorld(force);
  }
}

class ResourceManager {
  quaternions;
  threeEulers;
  threeMatrix4s;
  threeQuaternions;
  threeVector3s;
  transforms;
  vector3s;
  constructor() {
    this.threeVector3s = [];
    this.threeMatrix4s = [];
    this.threeQuaternions = [];
    this.threeEulers = [];
    this.transforms = [];
    this.quaternions = [];
    this.vector3s = [];
  }
  addVector3(v1, v2) {
    const v = this.allocVector3();
    v.setValue(v1.x() + v2.x(), v1.y() + v2.y(), v1.z() + v2.z());
    return v;
  }
  allocQuaternion() {
    return this.quaternions.length > 0 ? this.quaternions.pop() : new Ammo.btQuaternion(0, 0, 0, 0);
  }
  allocThreeEuler() {
    return this.threeEulers.length > 0 ? this.threeEulers.pop() : new Euler();
  }
  allocThreeMatrix4() {
    return this.threeMatrix4s.length > 0 ? this.threeMatrix4s.pop() : new Matrix4();
  }
  allocThreeQuaternion() {
    return this.threeQuaternions.length > 0 ? this.threeQuaternions.pop() : new Quaternion();
  }
  allocThreeVector3() {
    return this.threeVector3s.length > 0 ? this.threeVector3s.pop() : new Vector3();
  }
  allocTransform() {
    return this.transforms.length > 0 ? this.transforms.pop() : new Ammo.btTransform();
  }
  allocVector3() {
    return this.vector3s.length > 0 ? this.vector3s.pop() : new Ammo.btVector3();
  }
  // TODO: strict type
  columnOfMatrix3(m, i) {
    const v = this.allocVector3();
    v.setValue(m[i + 0], m[i + 3], m[i + 6]);
    return v;
  }
  copyOrigin(t1, t2) {
    const o = t2.getOrigin();
    this.setOrigin(t1, o);
  }
  dotVectors3(v1, v2) {
    return v1.x() * v2.x() + v1.y() * v2.y() + v1.z() * v2.z();
  }
  freeQuaternion(q) {
    this.quaternions.push(q);
  }
  freeThreeEuler(e) {
    this.threeEulers.push(e);
  }
  freeThreeMatrix4(m) {
    this.threeMatrix4s.push(m);
  }
  freeThreeQuaternion(q) {
    this.threeQuaternions.push(q);
  }
  freeThreeVector3(v) {
    this.threeVector3s.push(v);
  }
  freeTransform(t) {
    this.transforms.push(t);
  }
  freeVector3(v) {
    this.vector3s.push(v);
  }
  getBasis(t) {
    const q = this.allocQuaternion();
    t.getBasis().getRotation(q);
    return q;
  }
  getBasisAsMatrix3(t) {
    const q = this.getBasis(t);
    const m = this.quaternionToMatrix3(q);
    this.freeQuaternion(q);
    return m;
  }
  getOrigin(t) {
    return t.getOrigin();
  }
  inverseTransform(t) {
    const t2 = this.allocTransform();
    const m1 = this.getBasisAsMatrix3(t);
    const o = this.getOrigin(t);
    const m2 = this.transposeMatrix3(m1);
    const v1 = this.negativeVector3(o);
    const v2 = this.multiplyMatrix3ByVector3(m2, v1);
    this.setOrigin(t2, v2);
    this.setBasisFromMatrix3(t2, m2);
    this.freeVector3(v1);
    this.freeVector3(v2);
    return t2;
  }
  // TODO: strict type
  matrix3ToQuaternion(m) {
    const t = m[0] + m[4] + m[8];
    let s, w, x, y, z;
    if (t > 0) {
      s = Math.sqrt(t + 1) * 2;
      w = 0.25 * s;
      x = (m[7] - m[5]) / s;
      y = (m[2] - m[6]) / s;
      z = (m[3] - m[1]) / s;
    } else if (m[0] > m[4] && m[0] > m[8]) {
      s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2;
      w = (m[7] - m[5]) / s;
      x = 0.25 * s;
      y = (m[1] + m[3]) / s;
      z = (m[2] + m[6]) / s;
    } else if (m[4] > m[8]) {
      s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2;
      w = (m[2] - m[6]) / s;
      x = (m[1] + m[3]) / s;
      y = 0.25 * s;
      z = (m[5] + m[7]) / s;
    } else {
      s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2;
      w = (m[3] - m[1]) / s;
      x = (m[2] + m[6]) / s;
      y = (m[5] + m[7]) / s;
      z = 0.25 * s;
    }
    const q = this.allocQuaternion();
    q.setX(x);
    q.setY(y);
    q.setZ(z);
    q.setW(w);
    return q;
  }
  // TODO: strict type
  multiplyMatrices3(m1, m2) {
    const m3 = [];
    const v10 = this.rowOfMatrix3(m1, 0);
    const v11 = this.rowOfMatrix3(m1, 1);
    const v12 = this.rowOfMatrix3(m1, 2);
    const v20 = this.columnOfMatrix3(m2, 0);
    const v21 = this.columnOfMatrix3(m2, 1);
    const v22 = this.columnOfMatrix3(m2, 2);
    m3[0] = this.dotVectors3(v10, v20);
    m3[1] = this.dotVectors3(v10, v21);
    m3[2] = this.dotVectors3(v10, v22);
    m3[3] = this.dotVectors3(v11, v20);
    m3[4] = this.dotVectors3(v11, v21);
    m3[5] = this.dotVectors3(v11, v22);
    m3[6] = this.dotVectors3(v12, v20);
    m3[7] = this.dotVectors3(v12, v21);
    m3[8] = this.dotVectors3(v12, v22);
    this.freeVector3(v10);
    this.freeVector3(v11);
    this.freeVector3(v12);
    this.freeVector3(v20);
    this.freeVector3(v21);
    this.freeVector3(v22);
    return m3;
  }
  // TODO: strict type
  multiplyMatrix3ByVector3(m, v) {
    const v4 = this.allocVector3();
    const v0 = this.rowOfMatrix3(m, 0);
    const v1 = this.rowOfMatrix3(m, 1);
    const v2 = this.rowOfMatrix3(m, 2);
    const x = this.dotVectors3(v0, v);
    const y = this.dotVectors3(v1, v);
    const z = this.dotVectors3(v2, v);
    v4.setValue(x, y, z);
    this.freeVector3(v0);
    this.freeVector3(v1);
    this.freeVector3(v2);
    return v4;
  }
  multiplyTransforms(t1, t2) {
    const t = this.allocTransform();
    this.setIdentity(t);
    const m1 = this.getBasisAsMatrix3(t1);
    const m2 = this.getBasisAsMatrix3(t2);
    const o1 = this.getOrigin(t1);
    const o2 = this.getOrigin(t2);
    const v1 = this.multiplyMatrix3ByVector3(m1, o2);
    const v2 = this.addVector3(v1, o1);
    this.setOrigin(t, v2);
    const m3 = this.multiplyMatrices3(m1, m2);
    this.setBasisFromMatrix3(t, m3);
    this.freeVector3(v1);
    this.freeVector3(v2);
    return t;
  }
  negativeVector3(v) {
    const v2 = this.allocVector3();
    v2.setValue(-v.x(), -v.y(), -v.z());
    return v2;
  }
  quaternionToMatrix3(q) {
    const m = [];
    const x = q.x();
    const y = q.y();
    const z = q.z();
    const w = q.w();
    const xx = x * x;
    const yy = y * y;
    const zz = z * z;
    const xy = x * y;
    const yz = y * z;
    const zx = z * x;
    const xw = x * w;
    const yw = y * w;
    const zw = z * w;
    m[0] = 1 - 2 * (yy + zz);
    m[1] = 2 * (xy - zw);
    m[2] = 2 * (zx + yw);
    m[3] = 2 * (xy + zw);
    m[4] = 1 - 2 * (zz + xx);
    m[5] = 2 * (yz - xw);
    m[6] = 2 * (zx - yw);
    m[7] = 2 * (yz + xw);
    m[8] = 1 - 2 * (xx + yy);
    return m;
  }
  // TODO: strict type
  rowOfMatrix3(m, i) {
    const v = this.allocVector3();
    v.setValue(m[i * 3 + 0], m[i * 3 + 1], m[i * 3 + 2]);
    return v;
  }
  setBasis(t, q) {
    t.setRotation(q);
  }
  setBasisFromArray3(t, a) {
    const thQ = this.allocThreeQuaternion();
    const thE = this.allocThreeEuler();
    thE.set(a[0], a[1], a[2]);
    this.setBasisFromThreeQuaternion(t, thQ.setFromEuler(thE));
    this.freeThreeEuler(thE);
    this.freeThreeQuaternion(thQ);
  }
  // TODO: strict type
  setBasisFromMatrix3(t, m) {
    const q = this.matrix3ToQuaternion(m);
    this.setBasis(t, q);
    this.freeQuaternion(q);
  }
  setBasisFromThreeQuaternion(t, a) {
    const q = this.allocQuaternion();
    q.setX(a.x);
    q.setY(a.y);
    q.setZ(a.z);
    q.setW(a.w);
    this.setBasis(t, q);
    this.freeQuaternion(q);
  }
  setIdentity(t) {
    t.setIdentity();
  }
  setOrigin(t, v) {
    t.getOrigin().setValue(v.x(), v.y(), v.z());
  }
  setOriginFromArray3(t, a) {
    t.getOrigin().setValue(a[0], a[1], a[2]);
  }
  setOriginFromThreeVector3(t, v) {
    t.getOrigin().setValue(v.x, v.y, v.z);
  }
  // TODO: strict type
  transposeMatrix3(m) {
    const m2 = [];
    m2[0] = m[0];
    m2[1] = m[3];
    m2[2] = m[6];
    m2[3] = m[1];
    m2[4] = m[4];
    m2[5] = m[7];
    m2[6] = m[2];
    m2[7] = m[5];
    m2[8] = m[8];
    return m2;
  }
}

class RigidBody {
  body;
  bone;
  boneOffsetForm;
  boneOffsetFormInverse;
  manager;
  mesh;
  params;
  world;
  constructor(mesh, world, params, manager) {
    this.mesh = mesh;
    this.world = world;
    this.params = params;
    this.manager = manager;
    const generateShape = (p) => {
      switch (p.shapeType) {
        case 0:
          return new Ammo.btSphereShape(p.width);
        case 1:
          return new Ammo.btBoxShape(new Ammo.btVector3(p.width, p.height, p.depth));
        case 2:
          return new Ammo.btCapsuleShape(p.width, p.height);
        default:
          throw new Error(`unknown shape type ${p.shapeType}`);
      }
    };
    const bones = this.mesh.skeleton.bones;
    const bone = this.params.boneIndex === -1 ? new Bone() : bones[this.params.boneIndex];
    const shape = generateShape(this.params);
    const weight = this.params.type === 0 ? 0 : this.params.weight;
    const localInertia = this.manager.allocVector3();
    localInertia.setValue(0, 0, 0);
    if (weight !== 0) {
      shape.calculateLocalInertia(weight, localInertia);
    }
    const boneOffsetForm = this.manager.allocTransform();
    this.manager.setIdentity(boneOffsetForm);
    this.manager.setOriginFromArray3(boneOffsetForm, this.params.position);
    this.manager.setBasisFromArray3(boneOffsetForm, this.params.rotation);
    const vector = this.manager.allocThreeVector3();
    const boneForm = this.manager.allocTransform();
    this.manager.setIdentity(boneForm);
    this.manager.setOriginFromThreeVector3(boneForm, bone.getWorldPosition(vector));
    const form = this.manager.multiplyTransforms(boneForm, boneOffsetForm);
    const state = new Ammo.btDefaultMotionState(form);
    const info = new Ammo.btRigidBodyConstructionInfo(weight, state, shape, localInertia);
    info.set_m_friction(this.params.friction);
    info.set_m_restitution(this.params.restitution);
    const body = new Ammo.btRigidBody(info);
    if (this.params.type === 0) {
      body.setCollisionFlags(body.getCollisionFlags() | 2);
      body.setActivationState(4);
    }
    body.setDamping(this.params.positionDamping, this.params.rotationDamping);
    body.setSleepingThresholds(0, 0);
    this.world.addRigidBody(body, 1 << this.params.groupIndex, this.params.groupTarget);
    this.body = body;
    this.bone = bone;
    this.boneOffsetForm = boneOffsetForm;
    this.boneOffsetFormInverse = this.manager.inverseTransform(boneOffsetForm);
    this.manager.freeVector3(localInertia);
    this.manager.freeTransform(form);
    this.manager.freeTransform(boneForm);
    this.manager.freeThreeVector3(vector);
  }
  _getBoneTransform() {
    const manager = this.manager;
    const p = manager.allocThreeVector3();
    const q = manager.allocThreeQuaternion();
    const s = manager.allocThreeVector3();
    this.bone.matrixWorld.decompose(p, q, s);
    const tr = manager.allocTransform();
    manager.setOriginFromThreeVector3(tr, p);
    manager.setBasisFromThreeQuaternion(tr, q);
    const form = manager.multiplyTransforms(tr, this.boneOffsetForm);
    manager.freeTransform(tr);
    manager.freeThreeVector3(s);
    manager.freeThreeQuaternion(q);
    manager.freeThreeVector3(p);
    return form;
  }
  _getWorldTransformForBone() {
    const manager = this.manager;
    const tr = this.body.getCenterOfMassTransform();
    return manager.multiplyTransforms(tr, this.boneOffsetFormInverse);
  }
  _setPositionFromBone() {
    const manager = this.manager;
    const form = this._getBoneTransform();
    const tr = manager.allocTransform();
    this.body.getMotionState().getWorldTransform(tr);
    manager.copyOrigin(tr, form);
    this.body.setCenterOfMassTransform(tr);
    this.body.getMotionState().setWorldTransform(tr);
    manager.freeTransform(tr);
    manager.freeTransform(form);
  }
  _setTransformFromBone() {
    const manager = this.manager;
    const form = this._getBoneTransform();
    this.body.setCenterOfMassTransform(form);
    this.body.getMotionState().setWorldTransform(form);
    manager.freeTransform(form);
  }
  _updateBonePosition() {
    const manager = this.manager;
    const tr = this._getWorldTransformForBone();
    const thV = manager.allocThreeVector3();
    const o = manager.getOrigin(tr);
    thV.set(o.x(), o.y(), o.z());
    if (this.bone.parent) {
      this.bone.parent.worldToLocal(thV);
    }
    this.bone.position.copy(thV);
    manager.freeThreeVector3(thV);
    manager.freeTransform(tr);
  }
  _updateBoneRotation() {
    const manager = this.manager;
    const tr = this._getWorldTransformForBone();
    const q = manager.getBasis(tr);
    const thQ = manager.allocThreeQuaternion();
    const thQ2 = manager.allocThreeQuaternion();
    const thQ3 = manager.allocThreeQuaternion();
    thQ.set(q.x(), q.y(), q.z(), q.w());
    thQ2.setFromRotationMatrix(this.bone.matrixWorld);
    thQ2.conjugate();
    thQ2.multiply(thQ);
    thQ3.setFromRotationMatrix(this.bone.matrix);
    this.bone.quaternion.copy(thQ2.multiply(thQ3).normalize());
    manager.freeThreeQuaternion(thQ);
    manager.freeThreeQuaternion(thQ2);
    manager.freeThreeQuaternion(thQ3);
    manager.freeQuaternion(q);
    manager.freeTransform(tr);
  }
  /**
   * Resets rigid body transform to the current bone's.
   */
  reset() {
    this._setTransformFromBone();
    return this;
  }
  /**
   * Updates bone from the current rigid body's transform.
   */
  updateBone() {
    if (this.params.type === 0 || this.params.boneIndex === -1) {
      return this;
    }
    this._updateBoneRotation();
    if (this.params.type === 1) {
      this._updateBonePosition();
    }
    this.bone.updateMatrixWorld(true);
    if (this.params.type === 2) {
      this._setPositionFromBone();
    }
    return this;
  }
  /**
   * Updates rigid body's transform from the current bone.
   */
  updateFromBone() {
    if (this.params.boneIndex !== -1 && this.params.type === 0) {
      this._setTransformFromBone();
    }
    return this;
  }
}

class MMDPhysics {
  bodies;
  constraints;
  gravity;
  manager;
  maxStepNum;
  mesh;
  unitStep;
  world;
  constructor(mesh, rigidBodyParams, constraintParams = [], params = {}) {
    if (typeof Ammo === "undefined") {
      throw new TypeError("MMDPhysics: Import ammo.js https://github.com/kripken/ammo.js");
    }
    this.manager = new ResourceManager();
    this.mesh = mesh;
    this.unitStep = params.unitStep !== void 0 ? params.unitStep : 1 / 65;
    this.maxStepNum = params.maxStepNum !== void 0 ? params.maxStepNum : 3;
    this.gravity = new Vector3(0, -9.8 * 10, 0);
    if (params.gravity !== void 0)
      this.gravity.copy(params.gravity);
    if (params.world !== void 0)
      this.world = params.world;
    this.bodies = [];
    this.constraints = [];
    this._init(mesh, rigidBodyParams, constraintParams);
  }
  _createWorld() {
    const config = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(config);
    const cache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    return new Ammo.btDiscreteDynamicsWorld(dispatcher, cache, solver, config);
  }
  _init(mesh, rigidBodyParams, constraintParams) {
    const manager = this.manager;
    const parent = mesh.parent;
    if (parent !== null)
      mesh.parent = null;
    const currentPosition = manager.allocThreeVector3();
    const currentQuaternion = manager.allocThreeQuaternion();
    const currentScale = manager.allocThreeVector3();
    currentPosition.copy(mesh.position);
    currentQuaternion.copy(mesh.quaternion);
    currentScale.copy(mesh.scale);
    mesh.position.set(0, 0, 0);
    mesh.quaternion.set(0, 0, 0, 1);
    mesh.scale.set(1, 1, 1);
    mesh.updateMatrixWorld(true);
    if (this.world == null) {
      this.world = this._createWorld();
      this.setGravity(this.gravity);
    }
    this._initRigidBodies(rigidBodyParams);
    this._initConstraints(constraintParams);
    if (parent !== null)
      mesh.parent = parent;
    mesh.position.copy(currentPosition);
    mesh.quaternion.copy(currentQuaternion);
    mesh.scale.copy(currentScale);
    mesh.updateMatrixWorld(true);
    this.reset();
    manager.freeThreeVector3(currentPosition);
    manager.freeThreeQuaternion(currentQuaternion);
    manager.freeThreeVector3(currentScale);
  }
  _initConstraints(constraints) {
    for (let i = 0, il = constraints.length; i < il; i++) {
      const params = constraints[i];
      const bodyA = this.bodies[params.rigidBodyIndex1];
      const bodyB = this.bodies[params.rigidBodyIndex2];
      this.constraints.push(new Constraint(this.mesh, this.world, bodyA, bodyB, params, this.manager));
    }
  }
  _initRigidBodies(rigidBodies) {
    for (let i = 0, il = rigidBodies.length; i < il; i++) {
      this.bodies.push(new RigidBody(
        this.mesh,
        this.world,
        rigidBodies[i],
        this.manager
      ));
    }
  }
  _stepSimulation(delta) {
    const unitStep = this.unitStep;
    let stepTime = delta;
    let maxStepNum = (delta / unitStep | 0) + 1;
    if (stepTime < unitStep) {
      stepTime = unitStep;
      maxStepNum = 1;
    }
    if (maxStepNum > this.maxStepNum) {
      maxStepNum = this.maxStepNum;
    }
    this.world.stepSimulation(stepTime, maxStepNum, unitStep);
  }
  // private methods
  _updateBones() {
    for (let i = 0, il = this.bodies.length; i < il; i++) {
      this.bodies[i].updateBone();
    }
  }
  _updateRigidBodies() {
    for (let i = 0, il = this.bodies.length; i < il; i++) {
      this.bodies[i].updateFromBone();
    }
  }
  /**
   * Creates MMDPhysicsHelper
   */
  createHelper() {
    return new MMDPhysicsHelper(this.mesh, this);
  }
  /**
   * Resets rigid bodies transform to current bone's.
   *
   * @return {MMDPhysics}
   */
  reset() {
    for (let i = 0, il = this.bodies.length; i < il; i++) {
      this.bodies[i].reset();
    }
    return this;
  }
  /**
   * Sets gravity.
   */
  setGravity(gravity) {
    this.world.setGravity(new Ammo.btVector3(gravity.x, gravity.y, gravity.z));
    this.gravity.copy(gravity);
    return this;
  }
  /**
   * Advances Physics calculation and updates bones.
   */
  update(delta) {
    const manager = this.manager;
    const mesh = this.mesh;
    let isNonDefaultScale = false;
    const position = manager.allocThreeVector3();
    const quaternion = manager.allocThreeQuaternion();
    const scale = manager.allocThreeVector3();
    mesh.matrixWorld.decompose(position, quaternion, scale);
    if (scale.x !== 1 || scale.y !== 1 || scale.z !== 1) {
      isNonDefaultScale = true;
    }
    let parent;
    if (isNonDefaultScale) {
      parent = mesh.parent;
      if (parent !== null)
        mesh.parent = null;
      scale.copy(this.mesh.scale);
      mesh.scale.set(1, 1, 1);
      mesh.updateMatrixWorld(true);
    }
    this._updateRigidBodies();
    this._stepSimulation(delta);
    this._updateBones();
    if (isNonDefaultScale) {
      if (parent != null)
        mesh.parent = parent;
      mesh.scale.copy(scale);
    }
    manager.freeThreeVector3(scale);
    manager.freeThreeQuaternion(quaternion);
    manager.freeThreeVector3(position);
    return this;
  }
  /**
   * Warm ups Rigid bodies. Calculates cycles steps.
   */
  warmup(cycles) {
    for (let i = 0; i < cycles; i++) {
      this.update(1 / 60);
    }
    return this;
  }
}

class AudioManager {
  audio;
  audioDuration;
  currentTime;
  delayTime;
  duration;
  elapsedTime;
  constructor(audio, params = {}) {
    this.audio = audio;
    this.elapsedTime = 0;
    this.currentTime = 0;
    this.delayTime = params.delayTime !== void 0 ? params.delayTime : 0;
    this.audioDuration = this.audio.buffer.duration;
    this.duration = this.audioDuration + this.delayTime;
  }
  control(delta) {
    this.elapsedTime += delta;
    this.currentTime += delta;
    if (this.shouldStopAudio())
      this.audio.stop();
    if (this.shouldStartAudio())
      this.audio.play();
    return this;
  }
  shouldStartAudio() {
    if (this.audio.isPlaying)
      return false;
    while (this.currentTime >= this.duration) {
      this.currentTime -= this.duration;
    }
    if (this.currentTime < this.delayTime)
      return false;
    return this.currentTime - this.delayTime <= this.audioDuration;
  }
  shouldStopAudio() {
    return this.audio.isPlaying && this.currentTime >= this.duration;
  }
}

class GrantSolver {
  grants;
  mesh;
  q = new Quaternion();
  constructor(mesh, grants = []) {
    this.mesh = mesh;
    this.grants = grants;
  }
  addGrantRotation(bone, q, ratio) {
    this.q.set(0, 0, 0, 1);
    this.q.slerp(q, ratio);
    bone.quaternion.multiply(this.q);
    return this;
  }
  update() {
    const grants = this.grants;
    for (let i = 0, il = grants.length; i < il; i++) {
      this.updateOne(grants[i]);
    }
    return this;
  }
  updateOne(grant) {
    const bones = this.mesh.skeleton.bones;
    const bone = bones[grant.index];
    const parentBone = bones[grant.parentIndex];
    if (grant.isLocal) ; else {
      if (grant.affectRotation) {
        this.addGrantRotation(bone, parentBone.quaternion, grant.ratio);
      }
    }
    return this;
  }
}

const _quaternions = [];
let _quaternionIndex = 0;
const getQuaternion = () => {
  if (_quaternionIndex >= _quaternions.length)
    _quaternions.push(new Quaternion());
  return _quaternions[_quaternionIndex++];
};
const _grantResultMap = /* @__PURE__ */ new Map();
const updateOne = (mesh, boneIndex, ikSolver, grantSolver) => {
  const bones = mesh.skeleton.bones;
  const bonesData = mesh.geometry.userData.MMD.bones;
  const boneData = bonesData[boneIndex];
  const bone = bones[boneIndex];
  if (_grantResultMap.has(boneIndex))
    return;
  const quaternion = getQuaternion();
  _grantResultMap.set(boneIndex, quaternion.copy(bone.quaternion));
  if (grantSolver && boneData.grant && !boneData.grant.isLocal && boneData.grant.affectRotation) {
    const parentIndex = boneData.grant.parentIndex;
    const ratio = boneData.grant.ratio;
    if (!_grantResultMap.has(parentIndex)) {
      updateOne(mesh, parentIndex, ikSolver, grantSolver);
    }
    grantSolver.addGrantRotation(bone, _grantResultMap.get(parentIndex), ratio);
  }
  if (ikSolver && boneData.ik) {
    mesh.updateMatrixWorld(true);
    ikSolver.updateOne(boneData.ik);
    const links = boneData.ik.links;
    for (let i = 0, il = links.length; i < il; i++) {
      const link = links[i];
      if (link.enabled === false)
        continue;
      const linkIndex = link.index;
      if (_grantResultMap.has(linkIndex)) {
        _grantResultMap.set(linkIndex, _grantResultMap.get(linkIndex).copy(bones[linkIndex].quaternion));
      }
    }
  }
  quaternion.copy(bone.quaternion);
};
class MMDAnimationHelper {
  /**
   * @param {object} params - (optional)
   * @param {boolean} params.sync - Whether animation durations of added objects are synched. Default is true.
   * @param {number} params.afterglow - Default is 0.0.
   * @param {boolean} params.resetPhysicsOnLoop - Default is true.
   */
  constructor(params = {}) {
    this.meshes = [];
    this.camera = null;
    this.cameraTarget = new Object3D();
    this.cameraTarget.name = "target";
    this.audio = null;
    this.audioManager = null;
    this.objects = /* @__PURE__ */ new WeakMap();
    this.configuration = {
      afterglow: params.afterglow !== void 0 ? params.afterglow : 0,
      pmxAnimation: params.pmxAnimation !== void 0 ? params.pmxAnimation : false,
      resetPhysicsOnLoop: params.resetPhysicsOnLoop !== void 0 ? params.resetPhysicsOnLoop : true,
      sync: params.sync !== void 0 ? params.sync : true
    };
    this.enabled = {
      animation: true,
      cameraAnimation: true,
      grant: true,
      ik: true,
      physics: true
    };
    this.onBeforePhysics = () => {
    };
    this.sharedPhysics = false;
    this.masterPhysics = null;
  }
  _addMesh(mesh, params) {
    if (this.meshes.includes(mesh)) {
      throw new Error(`MMDAnimationHelper._addMesh: SkinnedMesh '${mesh.name}' has already been added.`);
    }
    this.meshes.push(mesh);
    this.objects.set(mesh, { looped: false });
    this._setupMeshAnimation(mesh, params.animation);
    if (params.physics !== false) {
      this._setupMeshPhysics(mesh, params);
    }
    return this;
  }
  _animateCamera(camera, delta) {
    const mixer = this.objects.get(camera).mixer;
    if (mixer && this.enabled.cameraAnimation) {
      mixer.update(delta);
      camera.updateProjectionMatrix();
      camera.up.set(0, 1, 0);
      camera.up.applyQuaternion(camera.quaternion);
      camera.lookAt(this.cameraTarget.position);
    }
  }
  _animateMesh(mesh, delta) {
    const objects = this.objects.get(mesh);
    const mixer = objects.mixer;
    const ikSolver = objects.ikSolver;
    const grantSolver = objects.grantSolver;
    const physics = objects.physics;
    const looped = objects.looped;
    if (mixer && this.enabled.animation) {
      this._restoreBones(mesh);
      mixer.update(delta);
      this._saveBones(mesh);
      if (this.configuration.pmxAnimation && mesh.geometry.userData.MMD && mesh.geometry.userData.MMD.format === "pmx") {
        if (!objects.sortedBonesData)
          objects.sortedBonesData = this._sortBoneDataArray(mesh.geometry.userData.MMD.bones.slice());
        this._animatePMXMesh(
          mesh,
          objects.sortedBonesData,
          ikSolver && this.enabled.ik ? ikSolver : null,
          grantSolver && this.enabled.grant ? grantSolver : null
        );
      } else {
        if (ikSolver && this.enabled.ik) {
          mesh.updateMatrixWorld(true);
          ikSolver.update();
        }
        if (grantSolver && this.enabled.grant) {
          grantSolver.update();
        }
      }
    }
    if (looped === true && this.enabled.physics) {
      if (physics && this.configuration.resetPhysicsOnLoop)
        physics.reset();
      objects.looped = false;
    }
    if (physics && this.enabled.physics && !this.sharedPhysics) {
      this.onBeforePhysics(mesh);
      physics.update(delta);
    }
  }
  // PMX Animation system is a bit too complex and doesn't great match to
  // Three.js Animation system. This method attempts to simulate it as much as
  // possible but doesn't perfectly simulate.
  // This method is more costly than the regular one so
  // you are recommended to set constructor parameter "pmxAnimation: true"
  // only if your PMX model animation doesn't work well.
  // If you need better method you would be required to write your own.
  _animatePMXMesh(mesh, sortedBonesData, ikSolver, grantSolver) {
    _quaternionIndex = 0;
    _grantResultMap.clear();
    for (let i = 0, il = sortedBonesData.length; i < il; i++) {
      updateOne(mesh, sortedBonesData[i].index, ikSolver, grantSolver);
    }
    mesh.updateMatrixWorld(true);
    return this;
  }
  _clearAudio(audio) {
    if (audio !== this.audio) {
      throw new Error(`MMDAnimationHelper._clearAudio: Audio '${audio.name}' has not been set yet.`);
    }
    this.objects.delete(this.audioManager);
    this.audio = null;
    this.audioManager = null;
    return this;
  }
  _clearCamera(camera) {
    if (camera !== this.camera) {
      throw new Error(`MMDAnimationHelper._clearCamera: Camera '${camera.name}' has not been set yet.`);
    }
    this.camera.remove(this.cameraTarget);
    this.objects.delete(this.camera);
    this.camera = null;
    return this;
  }
  // private methods
  _createCCDIKSolver(mesh) {
    if (CCDIKSolver === void 0) {
      throw new Error("MMDAnimationHelper: Import CCDIKSolver.");
    }
    return new CCDIKSolver(mesh, mesh.geometry.userData.MMD.iks);
  }
  _createMMDPhysics(mesh, params) {
    if (MMDPhysics === void 0) {
      throw new Error("MMDPhysics: Import MMDPhysics.");
    }
    return new MMDPhysics(
      mesh,
      mesh.geometry.userData.MMD.rigidBodies,
      mesh.geometry.userData.MMD.constraints,
      params
    );
  }
  _getMasterPhysics() {
    if (this.masterPhysics !== null)
      return this.masterPhysics;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const physics = this.meshes[i].physics;
      if (physics !== void 0 && physics !== null) {
        this.masterPhysics = physics;
        return this.masterPhysics;
      }
    }
    return null;
  }
  _optimizeIK(mesh, physicsEnabled) {
    const iks = mesh.geometry.userData.MMD.iks;
    const bones = mesh.geometry.userData.MMD.bones;
    for (let i = 0, il = iks.length; i < il; i++) {
      const ik = iks[i];
      const links = ik.links;
      for (let j = 0, jl = links.length; j < jl; j++) {
        const link = links[j];
        if (physicsEnabled === true) {
          link.enabled = bones[link.index].rigidBodyType <= 0;
        } else {
          link.enabled = true;
        }
      }
    }
  }
  _removeMesh(mesh) {
    let found = false;
    let writeIndex = 0;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      if (this.meshes[i] === mesh) {
        this.objects.delete(mesh);
        found = true;
        continue;
      }
      this.meshes[writeIndex++] = this.meshes[i];
    }
    if (!found) {
      throw new Error(`THREE.MMDAnimationHelper._removeMesh: SkinnedMesh '${mesh.name}' has not been added yet.`);
    }
    this.meshes.length = writeIndex;
    return this;
  }
  _restoreBones(mesh) {
    const objects = this.objects.get(mesh);
    const backupBones = objects.backupBones;
    if (backupBones === void 0)
      return;
    const bones = mesh.skeleton.bones;
    for (let i = 0, il = bones.length; i < il; i++) {
      const bone = bones[i];
      bone.position.fromArray(backupBones, i * 7);
      bone.quaternion.fromArray(backupBones, i * 7 + 3);
    }
  }
  /*
   * Avoiding these two issues by restore/save bones before/after mixer animation.
   *
   * 1. PropertyMixer used by AnimationMixer holds cache value in .buffer.
   *    Calculating IK, Grant, and Physics after mixer animation can break
   *    the cache coherency.
   *
   * 2. Applying Grant two or more times without reset the posing breaks model.
   */
  _saveBones(mesh) {
    const objects = this.objects.get(mesh);
    const bones = mesh.skeleton.bones;
    let backupBones = objects.backupBones;
    if (backupBones === void 0) {
      backupBones = new Float32Array(bones.length * 7);
      objects.backupBones = backupBones;
    }
    for (let i = 0, il = bones.length; i < il; i++) {
      const bone = bones[i];
      bone.position.toArray(backupBones, i * 7);
      bone.quaternion.toArray(backupBones, i * 7 + 3);
    }
  }
  _setupAudio(audio, params) {
    if (this.audio === audio) {
      throw new Error(`MMDAnimationHelper._setupAudio: Audio '${audio.name}' has already been set.`);
    }
    if (this.audio)
      this.clearAudio(this.audio);
    this.audio = audio;
    this.audioManager = new AudioManager(audio, params);
    this.objects.set(this.audioManager, {
      duration: this.audioManager.duration
    });
    return this;
  }
  _setupCamera(camera, params) {
    if (this.camera === camera) {
      throw new Error(`MMDAnimationHelper._setupCamera: Camera '${camera.name}' has already been set.`);
    }
    if (this.camera)
      this.clearCamera(this.camera);
    this.camera = camera;
    camera.add(this.cameraTarget);
    this.objects.set(camera, {});
    if (params.animation !== void 0) {
      this._setupCameraAnimation(camera, params.animation);
    }
    return this;
  }
  _setupCameraAnimation(camera, animation) {
    const animations = Array.isArray(animation) ? animation : [animation];
    const objects = this.objects.get(camera);
    objects.mixer = new AnimationMixer(camera);
    for (let i = 0, il = animations.length; i < il; i++) {
      objects.mixer.clipAction(animations[i]).play();
    }
  }
  _setupMeshAnimation(mesh, animation) {
    const objects = this.objects.get(mesh);
    if (animation !== void 0) {
      const animations = Array.isArray(animation) ? animation : [animation];
      objects.mixer = new AnimationMixer(mesh);
      for (let i = 0, il = animations.length; i < il; i++) {
        objects.mixer.clipAction(animations[i]).play();
      }
      objects.mixer.addEventListener("loop", (event) => {
        const tracks = event.action._clip.tracks;
        if (tracks.length > 0 && tracks[0].name.slice(0, 6) !== ".bones")
          return;
        objects.looped = true;
      });
    }
    objects.ikSolver = this._createCCDIKSolver(mesh);
    objects.grantSolver = this.createGrantSolver(mesh);
    return this;
  }
  _setupMeshPhysics(mesh, params) {
    const objects = this.objects.get(mesh);
    if (params.world === void 0 && this.sharedPhysics) {
      const masterPhysics = this._getMasterPhysics();
      if (masterPhysics !== null)
        world = masterPhysics.world;
    }
    objects.physics = this._createMMDPhysics(mesh, params);
    if (objects.mixer && params.animationWarmup !== false) {
      this._animateMesh(mesh, 0);
      objects.physics.reset();
    }
    objects.physics.warmup(params.warmup !== void 0 ? params.warmup : 60);
    this._optimizeIK(mesh, true);
  }
  // Sort bones in order by 1. transformationClass and 2. bone index.
  // In PMX animation system, bone transformations should be processed
  // in this order.
  _sortBoneDataArray(boneDataArray) {
    return boneDataArray.sort((a, b) => {
      if (a.transformationClass !== b.transformationClass) {
        return a.transformationClass - b.transformationClass;
      } else {
        return a.index - b.index;
      }
    });
  }
  /*
   * Detects the longest duration and then sets it to them to sync.
   * TODO: Not to access private properties ( ._actions and ._clip )
   */
  _syncDuration() {
    let max = 0;
    const objects = this.objects;
    const meshes = this.meshes;
    const camera = this.camera;
    const audioManager = this.audioManager;
    for (let i = 0, il = meshes.length; i < il; i++) {
      const mixer = this.objects.get(meshes[i]).mixer;
      if (mixer === void 0)
        continue;
      for (let j = 0; j < mixer._actions.length; j++) {
        const clip = mixer._actions[j]._clip;
        if (!objects.has(clip)) {
          objects.set(clip, {
            duration: clip.duration
          });
        }
        max = Math.max(max, objects.get(clip).duration);
      }
    }
    if (camera !== null) {
      const mixer = this.objects.get(camera).mixer;
      if (mixer !== void 0) {
        for (let i = 0, il = mixer._actions.length; i < il; i++) {
          const clip = mixer._actions[i]._clip;
          if (!objects.has(clip)) {
            objects.set(clip, {
              duration: clip.duration
            });
          }
          max = Math.max(max, objects.get(clip).duration);
        }
      }
    }
    if (audioManager !== null) {
      max = Math.max(max, objects.get(audioManager).duration);
    }
    max += this.configuration.afterglow;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const mixer = this.objects.get(this.meshes[i]).mixer;
      if (mixer === void 0)
        continue;
      for (let j = 0, jl = mixer._actions.length; j < jl; j++) {
        mixer._actions[j]._clip.duration = max;
      }
    }
    if (camera !== null) {
      const mixer = this.objects.get(camera).mixer;
      if (mixer !== void 0) {
        for (let i = 0, il = mixer._actions.length; i < il; i++) {
          mixer._actions[i]._clip.duration = max;
        }
      }
    }
    if (audioManager !== null) {
      audioManager.duration = max;
    }
  }
  _updatePropertyMixersBuffer(mesh) {
    const mixer = this.objects.get(mesh).mixer;
    const propertyMixers = mixer._bindings;
    const accuIndex = mixer._accuIndex;
    for (let i = 0, il = propertyMixers.length; i < il; i++) {
      const propertyMixer = propertyMixers[i];
      const buffer = propertyMixer.buffer;
      const stride = propertyMixer.valueSize;
      const offset = (accuIndex + 1) * stride;
      propertyMixer.binding.getValue(buffer, offset);
    }
  }
  _updateSharedPhysics(delta) {
    if (this.meshes.length === 0 || !this.enabled.physics || !this.sharedPhysics)
      return;
    const physics = this._getMasterPhysics();
    if (physics === null)
      return;
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const p = this.meshes[i].physics;
      if (p !== null && p !== void 0) {
        p.updateRigidBodies();
      }
    }
    physics.stepSimulation(delta);
    for (let i = 0, il = this.meshes.length; i < il; i++) {
      const p = this.meshes[i].physics;
      if (p !== null && p !== void 0) {
        p.updateBones();
      }
    }
  }
  /**
   * Adds an Three.js Object to helper and setups animation.
   * The animation durations of added objects are synched
   * if this.configuration.sync is true.
   *
   * @param {import('three').SkinnedMesh|import('three').Camera|import('three').Audio} object
   * @param {object} params - (optional)
   * @param {import('three').AnimationClip|Array<import('three').AnimationClip>} params.animation - Only for THREE.SkinnedMesh and THREE.Camera. Default is undefined.
   * @param {boolean} params.physics - Only for THREE.SkinnedMesh. Default is true.
   * @param {Integer} params.warmup - Only for THREE.SkinnedMesh and physics is true. Default is 60.
   * @param {number} params.unitStep - Only for THREE.SkinnedMesh and physics is true. Default is 1 / 65.
   * @param {Integer} params.maxStepNum - Only for THREE.SkinnedMesh and physics is true. Default is 3.
   * @param {Vector3} params.gravity - Only for THREE.SkinnedMesh and physics is true. Default ( 0, - 9.8 * 10, 0 ).
   * @param {number} params.delayTime - Only for THREE.Audio. Default is 0.0.
   * @return {MMDAnimationHelper}
   */
  add(object, params = {}) {
    if (object.isSkinnedMesh) {
      this._addMesh(object, params);
    } else if (object.isCamera) {
      this._setupCamera(object, params);
    } else if (object.type === "Audio") {
      this._setupAudio(object, params);
    } else {
      throw new Error("MMDAnimationHelper.add: accepts only THREE.SkinnedMesh or THREE.Camera or THREE.Audio instance.");
    }
    if (this.configuration.sync)
      this._syncDuration();
    return this;
  }
  // workaround
  /**
   * Creates an GrantSolver instance.
   *
   * @param {import('three').SkinnedMesh} mesh
   * @return {GrantSolver}
   */
  createGrantSolver(mesh) {
    return new GrantSolver(mesh, mesh.geometry.userData.MMD.grants);
  }
  /**
   * Enables/Disables an animation feature.
   *
   * @param {string} key
   * @param {boolean} enabled
   * @return {MMDAnimationHelper}
   */
  enable(key, enabled) {
    if (this.enabled[key] === void 0) {
      throw new Error(`MMDAnimationHelper.enable: unknown key ${key}`);
    }
    this.enabled[key] = enabled;
    if (key === "physics") {
      for (let i = 0, il = this.meshes.length; i < il; i++) {
        this._optimizeIK(this.meshes[i], enabled);
      }
    }
    return this;
  }
  /**
   * Changes the pose of SkinnedMesh as VPD specifies.
   *
   * @param {import('three').SkinnedMesh} mesh
   * @param {object} vpd - VPD content parsed MMDParser
   * @param {object} params - (optional)
   * @param {boolean} params.resetPose - Default is true.
   * @param {boolean} params.ik - Default is true.
   * @param {boolean} params.grant - Default is true.
   * @return {MMDAnimationHelper}
   */
  pose(mesh, vpd, params = {}) {
    if (params.resetPose !== false)
      mesh.pose();
    const bones = mesh.skeleton.bones;
    const boneParams = vpd.bones;
    const boneNameDictionary = {};
    for (let i = 0, il = bones.length; i < il; i++) {
      boneNameDictionary[bones[i].name] = i;
    }
    const vector = new Vector3();
    const quaternion = new Quaternion();
    for (let i = 0, il = boneParams.length; i < il; i++) {
      const boneParam = boneParams[i];
      const boneIndex = boneNameDictionary[boneParam.name];
      if (boneIndex === void 0)
        continue;
      const bone = bones[boneIndex];
      bone.position.add(vector.fromArray(boneParam.translation));
      bone.quaternion.multiply(quaternion.fromArray(boneParam.quaternion));
    }
    mesh.updateMatrixWorld(true);
    if (this.configuration.pmxAnimation && mesh.geometry.userData.MMD && mesh.geometry.userData.MMD.format === "pmx") {
      const sortedBonesData = this._sortBoneDataArray(mesh.geometry.userData.MMD.bones.slice());
      const ikSolver = params.ik !== false ? this._createCCDIKSolver(mesh) : null;
      const grantSolver = params.grant !== false ? this.createGrantSolver(mesh) : null;
      this._animatePMXMesh(mesh, sortedBonesData, ikSolver, grantSolver);
    } else {
      if (params.ik !== false) {
        this._createCCDIKSolver(mesh).update();
      }
      if (params.grant !== false) {
        this.createGrantSolver(mesh).update();
      }
    }
    return this;
  }
  // experimental
  /**
   * Removes an Three.js Object from helper.
   *
   * @param {import('three').SkinnedMesh|import('three').Camera|import('three').Audio} object
   * @return {MMDAnimationHelper}
   */
  remove(object) {
    if (object.isSkinnedMesh) {
      this._removeMesh(object);
    } else if (object.isCamera) {
      this._clearCamera(object);
    } else if (object.type === "Audio") {
      this._clearAudio(object);
    } else {
      throw new Error("MMDAnimationHelper.remove: accepts only THREE.SkinnedMesh or THREE.Camera or THREE.Audio instance.");
    }
    if (this.configuration.sync)
      this._syncDuration();
    return this;
  }
  /**
   * Updates the animation.
   *
   * @param {number} delta
   * @return {MMDAnimationHelper}
   */
  update(delta) {
    if (this.audioManager !== null)
      this.audioManager.control(delta);
    for (let i = 0; i < this.meshes.length; i++) {
      this._animateMesh(this.meshes[i], delta);
    }
    if (this.sharedPhysics)
      this._updateSharedPhysics(delta);
    if (this.camera !== null)
      this._animateCamera(this.camera, delta);
    return this;
  }
}

const extractModelExtension = (buffer) => {
  const decoder = new TextDecoder("utf-8");
  const bytes = new Uint8Array(buffer, 0, 3);
  return decoder.decode(bytes).toLowerCase();
};

const resolveResourcePath = (url, resourcePath, path) => resourcePath !== "" ? resourcePath : path !== "" ? path : LoaderUtils.extractUrlBase(url);

class GeometryBuilder {
  // TODO: remove class, convert to function
  /** @param data - parsed PMD/PMX data */
  build(data) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const skinIndices = [];
    const skinWeights = [];
    const indices = [];
    const groups = [];
    const bones = [];
    const morphTargets = [];
    const morphPositions = [];
    const iks = [];
    const grants = [];
    const rigidBodies = [];
    const constraints = [];
    let offset = 0;
    const boneTypeTable = {};
    for (let i = 0; i < data.metadata.vertexCount; i++) {
      const v = data.vertices[i];
      for (let j = 0, jl = v.position.length; j < jl; j++) {
        positions.push(v.position[j]);
      }
      for (let j = 0, jl = v.normal.length; j < jl; j++) {
        normals.push(v.normal[j]);
      }
      for (let j = 0, jl = v.uv.length; j < jl; j++) {
        uvs.push(v.uv[j]);
      }
      for (let j = 0; j < 4; j++) {
        skinIndices.push(v.skinIndices.length - 1 >= j ? v.skinIndices[j] : 0);
      }
      for (let j = 0; j < 4; j++) {
        skinWeights.push(v.skinWeights.length - 1 >= j ? v.skinWeights[j] : 0);
      }
    }
    for (let i = 0; i < data.metadata.faceCount; i++) {
      const face = data.faces[i];
      for (let j = 0, jl = face.indices.length; j < jl; j++) {
        indices.push(face.indices[j]);
      }
    }
    for (let i = 0; i < data.metadata.materialCount; i++) {
      const material = data.materials[i];
      groups.push({
        count: material.faceCount * 3,
        offset: offset * 3
      });
      offset += material.faceCount;
    }
    for (let i = 0; i < data.metadata.rigidBodyCount; i++) {
      const body = data.rigidBodies[i];
      let value = boneTypeTable[body.boneIndex];
      value = value == null ? body.type : Math.max(body.type, value);
      boneTypeTable[body.boneIndex] = value;
    }
    for (let i = 0; i < data.metadata.boneCount; i++) {
      const boneData = data.bones[i];
      const bone = {
        index: i,
        name: boneData.name,
        parent: boneData.parentIndex,
        pos: boneData.position.slice(0, 3),
        rigidBodyType: boneTypeTable[i] != null ? boneTypeTable[i] : -1,
        rotq: [0, 0, 0, 1],
        scl: [1, 1, 1],
        transformationClass: "transformationClass" in boneData ? boneData.transformationClass : void 0
      };
      if (bone.parent !== -1) {
        bone.pos[0] -= data.bones[bone.parent].position[0];
        bone.pos[1] -= data.bones[bone.parent].position[1];
        bone.pos[2] -= data.bones[bone.parent].position[2];
      }
      bones.push(bone);
    }
    if (data.metadata.format === "pmd") {
      for (let i = 0; i < data.metadata.ikCount; i++) {
        const ik = data.iks[i];
        const param = {
          effector: ik.effector,
          iteration: ik.iteration,
          links: [],
          maxAngle: ik.maxAngle * 4,
          target: ik.target
        };
        for (let j = 0, jl = ik.links.length; j < jl; j++) {
          const link = {};
          link.index = ik.links[j].index;
          link.enabled = true;
          if (data.bones[link.index].name.includes("\u3072\u3056"))
            link.limitation = new Vector3(1, 0, 0);
          param.links.push(link);
        }
        iks.push(param);
      }
    } else {
      for (let i = 0; i < data.metadata.boneCount; i++) {
        const { ik } = data.bones[i];
        if (ik === void 0)
          continue;
        const param = {
          effector: ik.effector,
          iteration: ik.iteration,
          links: [],
          maxAngle: ik.maxAngle,
          target: i
        };
        for (let j = 0, jl = ik.links.length; j < jl; j++) {
          const link = {};
          link.index = ik.links[j].index;
          link.enabled = true;
          if (ik.links[j].angleLimitation === 1) {
            const rotationMin = ik.links[j].lowerLimitationAngle;
            const rotationMax = ik.links[j].upperLimitationAngle;
            const tmp1 = -rotationMax[0];
            const tmp2 = -rotationMax[1];
            rotationMax[0] = -rotationMin[0];
            rotationMax[1] = -rotationMin[1];
            rotationMin[0] = tmp1;
            rotationMin[1] = tmp2;
            link.rotationMin = new Vector3().fromArray(rotationMin);
            link.rotationMax = new Vector3().fromArray(rotationMax);
          }
          param.links.push(link);
        }
        iks.push(param);
        bones[i].ik = param;
      }
    }
    if (data.metadata.format === "pmx") {
      const grantEntryMap = {};
      for (let i = 0; i < data.metadata.boneCount; i++) {
        const boneData = data.bones[i];
        const { grant } = boneData;
        if (grant === void 0)
          continue;
        const param = {
          affectPosition: grant.affectPosition,
          affectRotation: grant.affectRotation,
          index: i,
          isLocal: grant.isLocal,
          parentIndex: grant.parentIndex,
          ratio: grant.ratio,
          transformationClass: boneData.transformationClass
        };
        grantEntryMap[i] = { children: [], param, visited: false };
      }
      const rootEntry = { children: [], visited: false };
      for (const grantEntry of Object.values(grantEntryMap)) {
        const parentGrantEntry = grantEntry.param?.parentIndex != null ? grantEntryMap[grantEntry.param.parentIndex] : rootEntry;
        grantEntry.parent = parentGrantEntry;
        parentGrantEntry.children.push(grantEntry);
      }
      const traverse = (entry) => {
        if (entry.param) {
          grants.push(entry.param);
          bones[entry.param.index].grant = entry.param;
        }
        entry.visited = true;
        for (let i = 0, il = entry.children.length; i < il; i++) {
          const child = entry.children[i];
          if (!child.visited)
            traverse(child);
        }
      };
      traverse(rootEntry);
    }
    const updateAttributes = (attribute, morph, ratio) => {
      for (let i = 0; i < morph.elementCount; i++) {
        const element = morph.elements[i];
        let index;
        if (data.metadata.format === "pmd") {
          index = data.morphs[0].elements[element.index].index;
        } else {
          index = element.index;
        }
        attribute.array[index * 3 + 0] += element.position[0] * ratio;
        attribute.array[index * 3 + 1] += element.position[1] * ratio;
        attribute.array[index * 3 + 2] += element.position[2] * ratio;
      }
    };
    for (let i = 0; i < data.metadata.morphCount; i++) {
      const morph = data.morphs[i];
      const params = { name: morph.name };
      const attribute = new Float32BufferAttribute(data.metadata.vertexCount * 3, 3);
      attribute.name = morph.name;
      for (let j = 0; j < data.metadata.vertexCount * 3; j++) {
        attribute.array[j] = positions[j];
      }
      if (data.metadata.format === "pmd") {
        if (i !== 0) {
          updateAttributes(attribute, morph, 1);
        }
      } else {
        if (morph.type === 0) {
          for (let j = 0; j < morph.elementCount; j++) {
            const morph2 = data.morphs[morph.elements[j].index];
            const ratio = morph.elements[j].ratio;
            if (morph2.type === 1) {
              updateAttributes(attribute, morph2, ratio);
            }
          }
        } else if (morph.type === 1) {
          updateAttributes(attribute, morph, 1);
        } else if (morph.type === 2) ; else if (morph.type === 3) ; else if (morph.type === 4) ; else if (morph.type === 5) ; else if (morph.type === 6) ; else if (morph.type === 7) ; else if (morph.type === 8) ;
      }
      morphTargets.push(params);
      morphPositions.push(attribute);
    }
    for (let i = 0; i < data.metadata.rigidBodyCount; i++) {
      const rigidBody = data.rigidBodies[i];
      const params = structuredClone(rigidBody);
      if (data.metadata.format === "pmx") {
        if (params.boneIndex !== -1) {
          const bone = data.bones[params.boneIndex];
          params.position[0] -= bone.position[0];
          params.position[1] -= bone.position[1];
          params.position[2] -= bone.position[2];
        }
      }
      rigidBodies.push(params);
    }
    for (let i = 0; i < data.metadata.constraintCount; i++) {
      const constraint = data.constraints[i];
      const params = structuredClone(constraint);
      const bodyA = rigidBodies[params.rigidBodyIndex1];
      const bodyB = rigidBodies[params.rigidBodyIndex2];
      if (bodyA.type !== 0 && bodyB.type === 2) {
        if (bodyA.boneIndex !== -1 && bodyB.boneIndex !== -1 && data.bones[bodyB.boneIndex].parentIndex === bodyA.boneIndex) {
          bodyB.type = 1;
        }
      }
      constraints.push(params);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
    geometry.setAttribute("skinIndex", new Uint16BufferAttribute(skinIndices, 4));
    geometry.setAttribute("skinWeight", new Float32BufferAttribute(skinWeights, 4));
    geometry.setIndex(indices);
    for (let i = 0, il = groups.length; i < il; i++) {
      geometry.addGroup(groups[i].offset, groups[i].count, i);
    }
    geometry.bones = bones;
    geometry.morphTargets = morphTargets;
    geometry.morphAttributes.position = morphPositions;
    geometry.morphTargetsRelative = false;
    geometry.userData.MMD = {
      bones,
      constraints,
      format: data.metadata.format,
      grants,
      iks,
      rigidBodies
    };
    geometry.computeBoundingSphere();
    return geometry;
  }
}

const lights_mmd_toon_pars_fragment = (
  /* glsl */
  `
varying vec3 vViewPosition;

struct BlinnPhongMaterial {

	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;

};

void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;

	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;

}

void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {

	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );

}

#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong
`
);
const mmd_toon_matcap_fragment = (
  /* glsl */
  `
#ifdef USE_MATCAP

	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks
	vec4 matcapColor = texture2D( matcap, uv );

	#ifdef MATCAP_BLENDING_MULTIPLY

		outgoingLight *= matcapColor.rgb;

	#elif defined( MATCAP_BLENDING_ADD )

		outgoingLight += matcapColor.rgb;

	#endif

#endif
`
);
const MMDToonShader = {
  defines: {
    MATCAP: true,
    MATCAP_BLENDING_ADD: true,
    TOON: true
  },
  fragmentShader: ShaderLib.phong.fragmentShader.replace(
    "#include <common>",
    `
					#ifdef USE_MATCAP
						uniform sampler2D matcap;
					#endif

					#include <common>
				`
  ).replace(
    "#include <envmap_common_pars_fragment>",
    `
					#include <gradientmap_pars_fragment>
				`
  ).replace(
    "#include <envmap_pars_fragment>",
    ""
  ).replace(
    "#include <lights_phong_pars_fragment>",
    lights_mmd_toon_pars_fragment
  ).replace(
    "#include <envmap_fragment>",
    `
					${mmd_toon_matcap_fragment}
				`
  ),
  name: "MMDToonShader",
  uniforms: UniformsUtils.merge([
    ShaderLib.toon.uniforms,
    ShaderLib.phong.uniforms,
    ShaderLib.matcap.uniforms
  ]),
  vertexShader: ShaderLib.phong.vertexShader.replace(
    "#include <envmap_pars_vertex>",
    ""
  ).replace(
    "#include <envmap_vertex>",
    ""
  )
};

class MMDToonMaterial extends ShaderMaterial {
  combine;
  // TODO: emissive declared in MaterialJSON but not where can be
  // found under ShaderMaterial nor Material, but mentioned as
  // https://github.com/mrdoob/three.js/issues/28336, setting
  // emissive for colored textures was required.
  emissive;
  emissiveIntensity;
  flatShading;
  isMMDToonMaterial;
  normalMapType;
  type;
  wireframeLinecap;
  wireframeLinejoin;
  get matcapCombine() {
    return this._matcapCombine;
  }
  set matcapCombine(value) {
    this._matcapCombine = value;
    switch (value) {
      case MultiplyOperation:
        this.defines.MATCAP_BLENDING_MULTIPLY = true;
        delete this.defines.MATCAP_BLENDING_ADD;
        break;
      case AddOperation:
      default:
        this.defines.MATCAP_BLENDING_ADD = true;
        delete this.defines.MATCAP_BLENDING_MULTIPLY;
        break;
    }
  }
  get shininess() {
    return this._shininess;
  }
  // Special path for shininess to handle zero shininess properly
  set shininess(value) {
    this._shininess = value;
    this.uniforms.shininess.value = Math.max(this._shininess, 1e-4);
  }
  _matcapCombine;
  _shininess;
  constructor(parameters) {
    super();
    this.isMMDToonMaterial = true;
    this.type = "MMDToonMaterial";
    this._matcapCombine = AddOperation;
    this._shininess = 30;
    this.emissiveIntensity = 1;
    this.normalMapType = TangentSpaceNormalMap;
    this.combine = MultiplyOperation;
    this.wireframeLinecap = "round";
    this.wireframeLinejoin = "round";
    this.flatShading = false;
    this.lights = true;
    this.vertexShader = MMDToonShader.vertexShader;
    this.fragmentShader = MMDToonShader.fragmentShader;
    this.defines = Object.assign({}, MMDToonShader.defines);
    this.uniforms = UniformsUtils.clone(MMDToonShader.uniforms);
    const exposePropertyNames = [
      "specular",
      "opacity",
      "diffuse",
      "map",
      "matcap",
      "gradientMap",
      "lightMap",
      "lightMapIntensity",
      "aoMap",
      "aoMapIntensity",
      "emissive",
      "emissiveMap",
      "bumpMap",
      "bumpScale",
      "normalMap",
      "normalScale",
      "displacementBias",
      "displacementMap",
      "displacementScale",
      "specularMap",
      "alphaMap",
      "reflectivity",
      "refractionRatio"
    ];
    for (const propertyName of exposePropertyNames) {
      Object.defineProperty(this, propertyName, {
        get() {
          return this.uniforms[propertyName].value;
        },
        set(value) {
          this.uniforms[propertyName].value = value;
        }
      });
    }
    Object.defineProperty(
      this,
      "color",
      Object.getOwnPropertyDescriptor(this, "diffuse")
    );
    this.setValues(parameters);
  }
  copy(source) {
    super.copy(source);
    this._matcapCombine = source._matcapCombine;
    this._shininess = source._shininess;
    this.emissiveIntensity = source.emissiveIntensity;
    this.normalMapType = source.normalMapType;
    this.combine = source.combine;
    this.wireframeLinecap = source.wireframeLinecap;
    this.wireframeLinejoin = source.wireframeLinejoin;
    this.flatShading = source.flatShading;
    return this;
  }
}

const DEFAULT_TOON_TEXTURES = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAN0lEQVRYR+3WQREAMBACsZ5/bWiiMvgEBTt5cW37hjsBBAgQIECAwFwgyfYPCCBAgAABAgTWAh8aBHZBl14e8wAAAABJRU5ErkJggg==",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOUlEQVRYR+3WMREAMAwDsYY/yoDI7MLwIiP40+RJklfcCCBAgAABAgTqArfb/QMCCBAgQIAAgbbAB3z/e0F3js2cAAAAAElFTkSuQmCC",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAN0lEQVRYR+3WQREAMBACsZ5/B5ilMvgEBTt5cW37hjsBBAgQIECAwFwgyfYPCCBAgAABAgTWAh81dWyx0gFwKAAAAABJRU5ErkJggg==",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOklEQVRYR+3WoREAMAwDsWb/UQtCy9wxTOQJ/oQ8SXKKGwEECBAgQIBAXeDt7f4BAQQIECBAgEBb4AOz8Hzx7WLY4wAAAABJRU5ErkJggg==",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABPUlEQVRYR+1XwW7CMAy1+f9fZOMysSEOEweEOPRNdm3HbdOyIhAcklPrOs/PLy9RygBALxzcCDQFmgJNgaZAU6Ap0BR4PwX8gsRMVLssMRH5HcpzJEaWL7EVg9F1IHRlyqQohgVr4FGUlUcMJSjcUlDw0zvjeun70cLWmneoyf7NgBTQSniBTQQSuJAZsOnnaczjIMb5hCiuHKxokCrJfVnrctyZL0PkJAJe1HMil4nxeyi3Ypfn1kX51jpPvo/JeCNC4PhVdHdJw2XjBR8brF8PEIhNVn12AgP7uHsTBguBn53MUZCqv7Lp07Pn5k1Ro+uWmUNn7D+M57rtk7aG0Vo73xyF/fbFf0bPJjDXngnGocDTdFhygZjwUQrMNrDcmZlQT50VJ/g/UwNyHpu778+yW+/ksOz/BFo54P4AsUXMfRq7XWsAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACMElEQVRYR+2Xv4pTQRTGf2dubhLdICiii2KnYKHVolhauKWPoGAnNr6BD6CvIVaihYuI2i1ia0BY0MZGRHQXjZj/mSPnnskfNWiWZUlzJ5k7M2cm833nO5Mziej2DWWJRUoCpQKlAntSQCqgw39/iUWAGmh37jrRnVsKlgpiqmkoGVABA7E57fvY+pJDdgKqF6HzFCSADkDq+F6AHABtQ+UMVE5D7zXod7fFNhTEckTbj5XQgHzNN+5tQvc5NG7C6BNkp6D3EmpXHDR+dQAjFLchW3VS9rlw3JBh+B7ys5Cf9z0GW1C/7P32AyBAOAz1q4jGliIH3YPuBnSfQX4OGreTIgEYQb/pBDtPnEQ4CivXYPAWBk13oHrB54yA9QuSn2H4AcKRpEILDt0BUzj+RLR1V5EqjD66NPRBVpLcQwjHoHYJOhsQv6U4mnzmrIXJCFr4LDwm/xBUoboG9XX4cc9VKdYoSA2yk5NQLJaKDUjTBoveG3Z2TElTxwjNK4M3LEZgUdDdruvcXzKBpStgp2NPiWi3ks9ZXxIoFVi+AvHLdc9TqtjL3/aYjpPlrzOcEnK62Szhimdd7xX232zFDTgtxezOu3WNMRLjiKgjtOhHVMd1loynVHvOgjuIIJMaELEqhJAV/RCSLbWTcfPFakFgFlALTRRvx+ok6Hlp/Q+v3fmx90bMyUzaEAhmM3KvHlXTL5DxnbGf/1M8RNNACLL5MNtPxP/mypJAqcDSFfgFhpYqWUzhTEAAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAL0lEQVRYR+3QQREAAAzCsOFfNJPBJ1XQS9r2hsUAAQIECBAgQIAAAQIECBAgsBZ4MUx/ofm2I/kAAAAASUVORK5CYII="
];
const NON_ALPHA_CHANNEL_FORMATS = [
  RGB_S3TC_DXT1_Format,
  RGB_PVRTC_4BPPV1_Format,
  RGB_PVRTC_2BPPV1_Format,
  RGB_ETC1_Format,
  RGB_ETC2_Format
];
class MaterialBuilder {
  crossOrigin = "anonymous";
  manager;
  resourcePath;
  textureLoader;
  tgaLoader = void 0;
  constructor(manager) {
    this.manager = manager;
    this.textureLoader = new TextureLoader(manager);
  }
  // Check if the partial image area used by the texture is transparent.
  _checkImageTransparency(map, geometry, groupIndex) {
    map.readyCallbacks.push((texture) => {
      const createImageData = (image) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const detectImageTransparency = (image, uvs, indices) => {
        const width = image.width;
        const height = image.height;
        const data = image.data;
        const threshold = 253;
        const getAlphaByUv = (image2, uv) => {
          const width2 = image2.width;
          const height2 = image2.height;
          let x = Math.round(uv.x * width2) % width2;
          let y = Math.round(uv.y * height2) % height2;
          if (x < 0)
            x += width2;
          if (y < 0)
            y += height2;
          const index = y * width2 + x;
          return image2.data[index * 4 + 3];
        };
        if (data.length / (width * height) !== 4)
          return false;
        for (let i = 0; i < indices.length; i += 3) {
          const centerUV = { x: 0, y: 0 };
          for (let j = 0; j < 3; j++) {
            const index = indices[i * 3 + j];
            const uv = { x: uvs[index * 2 + 0], y: uvs[index * 2 + 1] };
            if (getAlphaByUv(image, uv) < threshold)
              return true;
            centerUV.x += uv.x;
            centerUV.y += uv.y;
          }
          centerUV.x /= 3;
          centerUV.y /= 3;
          if (getAlphaByUv(image, centerUV) < threshold)
            return true;
        }
        return false;
      };
      if ("isCompressedTexture" in texture && texture.isCompressedTexture === true) {
        if (NON_ALPHA_CHANNEL_FORMATS.includes(texture.format)) {
          map.transparent = false;
        } else {
          map.transparent = true;
        }
        return;
      }
      const imageData = "data" in texture.image && texture.image.data != null ? texture.image : createImageData(texture.image);
      const group = geometry.groups[groupIndex];
      if (detectImageTransparency(
        imageData,
        geometry.attributes.uv.array,
        geometry.index.array.slice(group.start, group.start + group.count)
      )) {
        map.transparent = true;
      }
    });
  }
  _getRotatedImage(image) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const width = image.width;
    const height = image.height;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.translate(width / 2, height / 2);
    context.rotate(0.5 * Math.PI);
    context.translate(-width / 2, -height / 2);
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, width, height);
  }
  _getTGALoader() {
    if (this.tgaLoader == null)
      this.tgaLoader = new TGALoader(this.manager);
    return this.tgaLoader;
  }
  /**
   * @param data - parsed PMD/PMX data
   * @param geometry - some properties are depended on geometry
   */
  build(data, geometry, _onProgress, _onError) {
    const materials = [];
    const textures = {};
    this.textureLoader.setCrossOrigin(this.crossOrigin);
    for (let i = 0; i < data.metadata.materialCount; i++) {
      const material = data.materials[i];
      const params = { userData: { MMD: {} } };
      if (material.name !== void 0)
        params.name = material.name;
      params.diffuse = new Color().setRGB(
        material.diffuse[0],
        material.diffuse[1],
        material.diffuse[2],
        SRGBColorSpace
      );
      params.opacity = material.diffuse[3];
      params.specular = new Color().setRGB(...material.specular, SRGBColorSpace);
      params.shininess = material.shininess;
      params.emissive = new Color().setRGB(...material.ambient, SRGBColorSpace);
      params.transparent = params.opacity !== 1;
      params.fog = true;
      params.blending = CustomBlending;
      params.blendSrc = SrcAlphaFactor;
      params.blendDst = OneMinusSrcAlphaFactor;
      params.blendSrcAlpha = SrcAlphaFactor;
      params.blendDstAlpha = DstAlphaFactor;
      if (data.metadata.format === "pmx" && (material.flag & 1) === 1) {
        params.side = DoubleSide;
      } else {
        params.side = params.opacity === 1 ? FrontSide : DoubleSide;
      }
      if (data.metadata.format === "pmd") {
        if (material.fileName) {
          const fileName = material.fileName;
          const fileNames = fileName.split("*");
          params.map = this._loadTexture(fileNames[0], textures);
          if (fileNames.length > 1) {
            const extension = fileNames[1].slice(-4).toLowerCase();
            params.matcap = this._loadTexture(
              fileNames[1],
              textures
            );
            params.matcapCombine = extension === ".sph" ? MultiplyOperation : AddOperation;
          }
        }
        const toonFileName = material.toonIndex === -1 ? "toon00.bmp" : data.toonTextures[material.toonIndex].fileName;
        params.gradientMap = this._loadTexture(
          toonFileName,
          textures,
          {
            isDefaultToonTexture: this._isDefaultToonTexture(toonFileName),
            isToonTexture: true
          }
        );
        params.userData.outlineParameters = {
          alpha: 1,
          color: [0, 0, 0],
          thickness: material.edgeFlag === 1 ? 3e-3 : 0,
          visible: material.edgeFlag === 1
        };
      } else {
        if (material.textureIndex !== -1) {
          params.map = this._loadTexture(data.textures[material.textureIndex], textures);
          params.userData.MMD.mapFileName = data.textures[material.textureIndex];
        }
        if (material.envTextureIndex !== -1 && (material.envFlag === 1 || material.envFlag === 2)) {
          params.matcap = this._loadTexture(
            data.textures[material.envTextureIndex],
            textures
          );
          params.userData.MMD.matcapFileName = data.textures[material.envTextureIndex];
          params.matcapCombine = material.envFlag === 1 ? MultiplyOperation : AddOperation;
        }
        let isDefaultToon, toonFileName;
        if (material.toonIndex === -1 || material.toonFlag !== 0) {
          toonFileName = `toon${`0${material.toonIndex + 1}`.slice(-2)}.bmp`;
          isDefaultToon = true;
        } else {
          toonFileName = data.textures[material.toonIndex];
          isDefaultToon = false;
        }
        params.gradientMap = this._loadTexture(
          toonFileName,
          textures,
          {
            isDefaultToonTexture: isDefaultToon,
            isToonTexture: true
          }
        );
        params.userData.outlineParameters = {
          alpha: material.edgeColor[3],
          color: material.edgeColor.slice(0, 3),
          thickness: material.edgeSize / 300,
          // TODO: better calculation?
          visible: (material.flag & 16) !== 0 && material.edgeSize > 0
        };
      }
      if (params.map !== void 0) {
        if (!params.transparent) {
          this._checkImageTransparency(params.map, geometry, i);
        }
        params.emissive.multiplyScalar(0.2);
      }
      materials.push(new MMDToonMaterial(params));
    }
    if (data.metadata.format === "pmx") {
      const checkAlphaMorph = (elements, materials2) => {
        for (let i = 0, il = elements.length; i < il; i++) {
          const element = elements[i];
          if (element.index === -1)
            continue;
          const material = materials2[element.index];
          if (material.opacity !== element.diffuse[3])
            material.transparent = true;
        }
      };
      for (let i = 0, il = data.morphs.length; i < il; i++) {
        const morph = data.morphs[i];
        const elements = morph.elements;
        if (morph.type === 0) {
          for (let j = 0, jl = elements.length; j < jl; j++) {
            const morph2 = data.morphs[elements[j].index];
            if (morph2.type !== 8)
              continue;
            checkAlphaMorph(morph2.elements, materials);
          }
        } else if (morph.type === 8) {
          checkAlphaMorph(elements, materials);
        }
      }
    }
    return materials;
  }
  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }
  setResourcePath(resourcePath) {
    this.resourcePath = resourcePath;
    return this;
  }
  // private methods
  _isDefaultToonTexture(name) {
    if (name.length !== 10)
      return false;
    return /toon(?:10|0\d)\.bmp/.test(name);
  }
  _loadTexture(filePath, textures, params, onProgress, onError) {
    params = params || {};
    let fullPath;
    if (params.isDefaultToonTexture === true) {
      let index;
      try {
        index = Number.parseInt(/toon(\d{2})\.bmp$/.exec(filePath)[1]);
      } catch {
        console.warn(`MMDLoader: ${filePath} seems like a not right default texture path. Using toon00.bmp instead.`);
        index = 0;
      }
      fullPath = DEFAULT_TOON_TEXTURES[index];
    } else {
      fullPath = this.resourcePath + filePath;
    }
    if (textures[fullPath] != null)
      return textures[fullPath];
    let loader = this.manager.getHandler(fullPath);
    if (loader === null) {
      loader = filePath.slice(-4).toLowerCase() === ".tga" ? this._getTGALoader() : this.textureLoader;
    }
    const texture = loader.load(fullPath, (t) => {
      if (params.isToonTexture === true) {
        t.image = this._getRotatedImage(t.image);
        t.magFilter = NearestFilter;
        t.minFilter = NearestFilter;
        t.generateMipmaps = false;
      }
      t.flipY = false;
      t.wrapS = RepeatWrapping;
      t.wrapT = RepeatWrapping;
      t.colorSpace = SRGBColorSpace;
      for (let i = 0; i < texture.readyCallbacks.length; i++) {
        texture.readyCallbacks[i](texture);
      }
      delete texture.readyCallbacks;
    }, onProgress, onError);
    texture.readyCallbacks = [];
    textures[fullPath] = texture;
    return texture;
  }
}

class MeshBuilder {
  crossOrigin = "anonymous";
  geometryBuilder;
  materialBuilder;
  constructor(manager) {
    this.geometryBuilder = new GeometryBuilder();
    this.materialBuilder = new MaterialBuilder(manager);
  }
  /**
   * @param data - parsed PMD/PMX data
   */
  build(data, resourcePath, onProgress, onError) {
    const geometry = this.geometryBuilder.build(data);
    const material = this.materialBuilder.setCrossOrigin(this.crossOrigin).setResourcePath(resourcePath).build(data, geometry, onProgress, onError);
    const mesh = new SkinnedMesh(geometry, material);
    const skeleton = new Skeleton(this.initBones(mesh));
    mesh.bind(skeleton);
    return mesh;
  }
  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }
  initBones(mesh) {
    const geometry = mesh.geometry;
    const bones = [];
    if (geometry.bones !== void 0) {
      for (let i = 0, il = geometry.bones.length; i < il; i++) {
        const { name, pos, rotq, scl } = geometry.bones[i];
        const bone = new Bone();
        bone.name = name;
        bone.position.fromArray(pos);
        bone.quaternion.fromArray(rotq);
        if (scl !== void 0)
          bone.scale.fromArray(scl);
        bones.push(bone);
      }
      for (let i = 0, il = geometry.bones.length; i < il; i++) {
        const { parent } = geometry.bones[i];
        if (parent != null && parent !== -1 && bones[parent] != null) {
          bones[parent].add(bones[i]);
        } else {
          mesh.add(bones[i]);
        }
      }
    }
    mesh.updateMatrixWorld(true);
    return bones;
  }
}

class MMDLoader extends Loader {
  meshBuilder;
  constructor(manager) {
    super(manager);
    this.meshBuilder = new MeshBuilder(this.manager);
  }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    const builder = this.meshBuilder.setCrossOrigin(this.crossOrigin);
    const resourcePath = resolveResourcePath(url, this.resourcePath, this.path);
    loader.setResponseType("arraybuffer");
    loader.setPath(this.path);
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      (buffer) => {
        try {
          const modelExtension = extractModelExtension(buffer);
          if (!["pmd", "pmx"].includes(modelExtension)) {
            onError?.(new Error(`ExperimentalMMDLoader: Unknown model file extension .${modelExtension}.`));
            return;
          }
          const data = modelExtension === "pmd" ? MMDParser.parsePmd(buffer, true) : MMDParser.parsePmx(buffer, true);
          const mesh = builder.build(data, resourcePath, onProgress, onError);
          onLoad(mesh);
        } catch (e) {
          onError?.(e);
        }
      }
    );
  }
  async loadAsync(url, onProgress) {
    return super.loadAsync(url, onProgress);
  }
}

class PMDLoader extends Loader {
  meshBuilder;
  constructor(manager) {
    super(manager);
    this.meshBuilder = new MeshBuilder(this.manager);
  }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    const builder = this.meshBuilder.setCrossOrigin(this.crossOrigin);
    const resourcePath = resolveResourcePath(url, this.resourcePath, this.path);
    loader.setResponseType("arraybuffer");
    loader.setPath(this.path);
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      (buffer) => {
        try {
          const modelExtension = extractModelExtension(buffer);
          if (modelExtension !== "pmd") {
            onError?.(new Error(`PMDLoader: Unknown model file extension .${modelExtension}.`));
            return;
          }
          const data = MMDParser.parsePmd(buffer, true);
          const mesh = builder.build(data, resourcePath, onProgress, onError);
          onLoad(mesh);
        } catch (e) {
          onError?.(e);
        }
      },
      onProgress,
      onError
    );
  }
  async loadAsync(url, onProgress) {
    return super.loadAsync(url, onProgress);
  }
}

class PMXLoader extends Loader {
  meshBuilder;
  constructor(manager) {
    super(manager);
    this.meshBuilder = new MeshBuilder(this.manager);
  }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    const builder = this.meshBuilder.setCrossOrigin(this.crossOrigin);
    const resourcePath = resolveResourcePath(url, this.resourcePath, this.path);
    loader.setResponseType("arraybuffer");
    loader.setPath(this.path);
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      (buffer) => {
        try {
          const modelExtension = extractModelExtension(buffer);
          if (modelExtension !== "pmx") {
            onError?.(new Error(`PMXLoader: Unknown model file extension .${modelExtension}.`));
            return;
          }
          const data = MMDParser.parsePmx(buffer, true);
          const mesh = builder.build(data, resourcePath, onProgress, onError);
          onLoad(mesh);
        } catch (e) {
          onError?.(e);
        }
      },
      onProgress,
      onError
    );
  }
  async loadAsync(url, onProgress) {
    return super.loadAsync(url, onProgress);
  }
}

class VMDLoader extends Loader {
  animationPath;
  constructor(manager) {
    super(manager);
  }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    if (this.animationPath != null)
      loader.setPath(this.animationPath);
    loader.setResponseType("arraybuffer");
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      (buffer) => {
        try {
          onLoad(MMDParser.parseVmd(buffer, true));
        } catch (e) {
          onError?.(e);
        }
      },
      onProgress,
      onError
    );
  }
  async loadAsync(url, onProgress) {
    return super.loadAsync(url, onProgress);
  }
  setAnimationPath(animationPath) {
    this.animationPath = animationPath;
    return this;
  }
}

class VPDLoader extends Loader {
  animationPath;
  isUnicode = true;
  constructor(manager) {
    super(manager);
  }
  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    if (this.animationPath != null)
      loader.setPath(this.animationPath);
    if (!this.isUnicode)
      loader.setMimeType("text/plain; charset=shift_jis");
    loader.setResponseType("text");
    loader.setRequestHeader(this.requestHeader);
    loader.setWithCredentials(this.withCredentials);
    loader.load(
      url,
      (text) => {
        try {
          onLoad(MMDParser.parseVpd(text, true));
        } catch (e) {
          onError?.(e);
        }
      },
      onProgress,
      onError
    );
  }
  async loadAsync(url, onProgress) {
    return super.loadAsync(url, onProgress);
  }
  setAnimationPath(animationPath) {
    this.animationPath = animationPath;
    return this;
  }
  setIsUnicode(isUnicode) {
    this.isUnicode = isUnicode;
    return this;
  }
}

class CubicBezierInterpolation extends Interpolant {
  interpolationParams;
  constructor(parameterPositions, sampleValues, sampleSize, resultBuffer, params) {
    super(parameterPositions, sampleValues, sampleSize, resultBuffer);
    this.interpolationParams = params;
  }
  _calculate(x1, x2, y1, y2, x) {
    let c = 0.5;
    let t = c;
    let s = 1 - t;
    const loop = 15;
    const eps = 1e-5;
    const math = Math;
    let sst3, stt3, ttt;
    for (let i = 0; i < loop; i++) {
      sst3 = 3 * s * s * t;
      stt3 = 3 * s * t * t;
      ttt = t * t * t;
      const ft = sst3 * x1 + stt3 * x2 + ttt - x;
      if (math.abs(ft) < eps)
        break;
      c /= 2;
      t += ft < 0 ? c : -c;
      s = 1 - t;
    }
    return sst3 * y1 + stt3 * y2 + ttt;
  }
  interpolate_(i1, t0, t, t1) {
    const result = this.resultBuffer;
    const values = this.sampleValues;
    const stride = this.valueSize;
    const params = this.interpolationParams;
    const offset1 = i1 * stride;
    const offset0 = offset1 - stride;
    const weight1 = t1 - t0 < 1 / 30 * 1.5 ? 0 : (t - t0) / (t1 - t0);
    if (stride === 4) {
      const x1 = params[i1 * 4 + 0];
      const x2 = params[i1 * 4 + 1];
      const y1 = params[i1 * 4 + 2];
      const y2 = params[i1 * 4 + 3];
      const ratio = this._calculate(x1, x2, y1, y2, weight1);
      Quaternion.slerpFlat(result, 0, values, offset0, values, offset1, ratio);
    } else if (stride === 3) {
      for (let i = 0; i < stride; ++i) {
        const x1 = params[i1 * 12 + i * 4 + 0];
        const x2 = params[i1 * 12 + i * 4 + 1];
        const y1 = params[i1 * 12 + i * 4 + 2];
        const y2 = params[i1 * 12 + i * 4 + 3];
        const ratio = this._calculate(x1, x2, y1, y2, weight1);
        result[i] = values[offset0 + i] * (1 - ratio) + values[offset1 + i] * ratio;
      }
    } else {
      const x1 = params[i1 * 4 + 0];
      const x2 = params[i1 * 4 + 1];
      const y1 = params[i1 * 4 + 2];
      const y2 = params[i1 * 4 + 3];
      const ratio = this._calculate(x1, x2, y1, y2, weight1);
      result[0] = values[offset0] * (1 - ratio) + values[offset1] * ratio;
    }
    return result;
  }
}
class AnimationBuilder {
  /**
   * @param vmd - parsed VMD data
   * @param mesh - tracks will be fitting to mesh
   */
  build(vmd, mesh) {
    const tracks = this.buildSkeletalAnimation(vmd, mesh).tracks;
    const tracks2 = this.buildMorphAnimation(vmd, mesh).tracks;
    for (let i = 0, il = tracks2.length; i < il; i++) {
      tracks.push(tracks2[i]);
    }
    return new AnimationClip("", -1, tracks);
  }
  /** @param vmd - parsed VMD data */
  buildCameraAnimation(vmd) {
    const pushVector3 = (array, vec) => {
      array.push(vec.x);
      array.push(vec.y);
      array.push(vec.z);
    };
    const pushQuaternion = (array, q) => {
      array.push(q.x);
      array.push(q.y);
      array.push(q.z);
      array.push(q.w);
    };
    const pushInterpolation = (array, interpolation, index) => {
      array.push(interpolation[index * 4 + 0] / 127);
      array.push(interpolation[index * 4 + 1] / 127);
      array.push(interpolation[index * 4 + 2] / 127);
      array.push(interpolation[index * 4 + 3] / 127);
    };
    const cameras = vmd.cameras == null ? [] : vmd.cameras.slice();
    cameras.sort((a, b) => {
      return a.frameNum - b.frameNum;
    });
    const times = [];
    const centers = [];
    const quaternions = [];
    const positions = [];
    const fovs = [];
    const cInterpolations = [];
    const qInterpolations = [];
    const pInterpolations = [];
    const fInterpolations = [];
    const quaternion = new Quaternion();
    const euler = new Euler();
    const position = new Vector3();
    const center = new Vector3();
    for (let i = 0, il = cameras.length; i < il; i++) {
      const motion = cameras[i];
      const time = motion.frameNum / 30;
      const pos = motion.position;
      const rot = motion.rotation;
      const distance = motion.distance;
      const fov = motion.fov;
      const interpolation = motion.interpolation;
      times.push(time);
      position.set(0, 0, -distance);
      center.set(pos[0], pos[1], pos[2]);
      euler.set(-rot[0], -rot[1], -rot[2]);
      quaternion.setFromEuler(euler);
      position.add(center);
      position.applyQuaternion(quaternion);
      pushVector3(centers, center);
      pushQuaternion(quaternions, quaternion);
      pushVector3(positions, position);
      fovs.push(fov);
      for (let j = 0; j < 3; j++) {
        pushInterpolation(cInterpolations, interpolation, j);
      }
      pushInterpolation(qInterpolations, interpolation, 3);
      for (let j = 0; j < 3; j++) {
        pushInterpolation(pInterpolations, interpolation, 4);
      }
      pushInterpolation(fInterpolations, interpolation, 5);
    }
    const tracks = [];
    tracks.push(this._createTrack("target.position", VectorKeyframeTrack, times, centers, cInterpolations));
    tracks.push(this._createTrack(".quaternion", QuaternionKeyframeTrack, times, quaternions, qInterpolations));
    tracks.push(this._createTrack(".position", VectorKeyframeTrack, times, positions, pInterpolations));
    tracks.push(this._createTrack(".fov", NumberKeyframeTrack, times, fovs, fInterpolations));
    return new AnimationClip("", -1, tracks);
  }
  _createTrack(node, TypedKeyframeTrack, times, values, interpolations) {
    if (times.length > 2) {
      times = times.slice();
      values = values.slice();
      interpolations = interpolations.slice();
      const stride = values.length / times.length;
      const interpolateStride = interpolations.length / times.length;
      let index = 1;
      for (let aheadIndex = 2, endIndex = times.length; aheadIndex < endIndex; aheadIndex++) {
        for (let i = 0; i < stride; i++) {
          if (values[index * stride + i] !== values[(index - 1) * stride + i] || values[index * stride + i] !== values[aheadIndex * stride + i]) {
            index++;
            break;
          }
        }
        if (aheadIndex > index) {
          times[index] = times[aheadIndex];
          for (let i = 0; i < stride; i++) {
            values[index * stride + i] = values[aheadIndex * stride + i];
          }
          for (let i = 0; i < interpolateStride; i++) {
            interpolations[index * interpolateStride + i] = interpolations[aheadIndex * interpolateStride + i];
          }
        }
      }
      times.length = index + 1;
      values.length = (index + 1) * stride;
      interpolations.length = (index + 1) * interpolateStride;
    }
    const track = new TypedKeyframeTrack(node, times, values);
    track.createInterpolant = function InterpolantFactoryMethodCubicBezier(result) {
      return new CubicBezierInterpolation(this.times, this.values, this.getValueSize(), result, new Float32Array(interpolations));
    };
    return track;
  }
  /**
   * @param vmd - parsed VMD data
   * @param mesh - tracks will be fitting to mesh
   */
  buildMorphAnimation(vmd, mesh) {
    const tracks = [];
    const morphs = {};
    const morphTargetDictionary = mesh.morphTargetDictionary;
    for (let i = 0; i < vmd.metadata.morphCount; i++) {
      const morph = vmd.morphs[i];
      const morphName = morph.morphName;
      if (morphTargetDictionary[morphName] == null)
        continue;
      morphs[morphName] = morphs[morphName] ?? [];
      morphs[morphName].push(morph);
    }
    for (const [key, array] of Object.entries(morphs)) {
      array.sort((a, b) => {
        return a.frameNum - b.frameNum;
      });
      const times = [];
      const values = [];
      for (let i = 0, il = array.length; i < il; i++) {
        times.push(array[i].frameNum / 30);
        values.push(array[i].weight);
      }
      tracks.push(new NumberKeyframeTrack(`.morphTargetInfluences[${morphTargetDictionary[key]}]`, times, values));
    }
    return new AnimationClip("", -1, tracks);
  }
  // private method
  /**
   * @param vmd - parsed VMD data
   * @param mesh - tracks will be fitting to mesh
   */
  buildSkeletalAnimation(vmd, mesh) {
    const pushInterpolation = (array, interpolation, index) => {
      array.push(interpolation[index + 0] / 127);
      array.push(interpolation[index + 8] / 127);
      array.push(interpolation[index + 4] / 127);
      array.push(interpolation[index + 12] / 127);
    };
    const tracks = [];
    const motions = {};
    const bones = mesh.skeleton.bones;
    const boneNameDictionary = {};
    for (let i = 0, il = bones.length; i < il; i++) {
      boneNameDictionary[bones[i].name] = true;
    }
    for (let i = 0; i < vmd.metadata.motionCount; i++) {
      const motion = vmd.motions[i];
      const boneName = motion.boneName;
      if (boneNameDictionary[boneName] == null)
        continue;
      motions[boneName] = motions[boneName] ?? [];
      motions[boneName].push(motion);
    }
    for (const [key, array] of Object.entries(motions)) {
      array.sort((a, b) => {
        return a.frameNum - b.frameNum;
      });
      const times = [];
      const positions = [];
      const rotations = [];
      const pInterpolations = [];
      const rInterpolations = [];
      const basePosition = mesh.skeleton.getBoneByName(key).position.toArray();
      for (let i = 0, il = array.length; i < il; i++) {
        const time = array[i].frameNum / 30;
        const position = array[i].position;
        const rotation = array[i].rotation;
        const interpolation = array[i].interpolation;
        times.push(time);
        for (let j = 0; j < 3; j++) positions.push(basePosition[j] + position[j]);
        for (let j = 0; j < 4; j++) rotations.push(rotation[j]);
        for (let j = 0; j < 3; j++) pushInterpolation(pInterpolations, interpolation, j);
        pushInterpolation(rInterpolations, interpolation, 3);
      }
      const targetName = `.bones[${key}]`;
      tracks.push(this._createTrack(`${targetName}.position`, VectorKeyframeTrack, times, positions, pInterpolations));
      tracks.push(this._createTrack(`${targetName}.quaternion`, QuaternionKeyframeTrack, times, rotations, rInterpolations));
    }
    return new AnimationClip("", -1, tracks);
  }
}

const createMMDAnimationClip = (vmd, object) => {
  const builder = new AnimationBuilder();
  return "isCamera" in object && object.isCamera ? builder.buildCameraAnimation(vmd) : builder.build(vmd, object);
};

const initAmmo = async () => Ammo.bind(Ammo)(Ammo);

export { MMDAnimationHelper, MMDLoader, MMDPhysics, MMDPhysicsHelper, MMDToonMaterial, MMDToonShader, PMDLoader, PMXLoader, VMDLoader, VPDLoader, createMMDAnimationClip, initAmmo };
