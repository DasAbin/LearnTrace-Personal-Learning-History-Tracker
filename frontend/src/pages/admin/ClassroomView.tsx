import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import type { StudentSummary, StudentDetail } from '../../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, useGLTF, ContactShadows, Html } from '@react-three/drei';
import { ArrowLeft, Loader2, X, BookOpen, Clock, Award, Users, Info } from 'lucide-react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// ─── CRITICAL FIX: preload both models on module load ───
useGLTF.preload('/Boy.glb');
useGLTF.preload('/Girl.glb');

// ─── CRITICAL FIX: normalise a loaded scene so it fits in a 1-unit tall box ───
// The Boy GLB has CharacterArmature scale=[100,100,100] baked in.
// The Girl GLB has the same. We strip that out by computing the bounding box
// of the clone and scaling it down uniformly so the character is ~1.8 units tall.
function normaliseClone(clone: THREE.Group): THREE.Group {
  // Compute the world bounding box BEFORE we touch scale
  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  box.getSize(size);

  const tallest = Math.max(size.x, size.y, size.z);
  if (tallest === 0) return clone; // guard against empty scene

  // Target height in Three.js world units — ~1.8 units = a normal-sized person
  const TARGET_HEIGHT = 1.8;
  const uniformScale = TARGET_HEIGHT / tallest;

  clone.scale.setScalar(uniformScale);

  // Re-centre at y=0 (feet on the floor)
  const box2 = new THREE.Box3().setFromObject(clone);
  clone.position.y -= box2.min.y;

  return clone;
}

// ──────── 3D Student GLB Component ────────
function StudentAvatar({
  student, index, total, onClick, isSelected,
}: {
  student: StudentSummary;
  index: number;
  total: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const gender = (student.gender || '').toLowerCase();
  const isMale = gender !== 'female';
  const modelUrl = isMale ? '/Boy.glb' : '/Girl.glb';

  const { scene } = useGLTF(modelUrl) as any;
  console.log(`🔷 Avatar status for ${student.firstName}: scene? ${!!scene}`);

  // Clone + normalise so baked scale=100 is cancelled out
  const clone = useMemo(() => {
    if (!scene) return null;
    console.log(`🔷 Normalising avatar for ${student.firstName}...`);
    const c = SkeletonUtils.clone(scene) as THREE.Group;
    return normaliseClone(c);
  }, [scene, student.firstName]);

  // Grid layout
  const cols = Math.min(total, 6);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 2.8;
  const x = (col - (cols - 1) / 2) * spacing;
  const z = row * spacing;

  const timeOffset = useRef(Math.random() * Math.PI * 2);

  useFrame((state) => {
    if (!group.current) return;
    if (isSelected) {
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        0.25 + Math.sin(state.clock.elapsedTime * 2) * 0.04,
        0.08,
      );
      group.current.rotation.y += 0.01;
    } else {
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        Math.sin(state.clock.elapsedTime + timeOffset.current) * 0.02,
        0.08,
      );
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y, 0, 0.05,
      );
    }
  });

  return (
    <group position={[x, 0, z]}>
      <group
        ref={group}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        {/* The primitive — NO scale prop here; normaliseClone already set it */}
        <primitive object={clone} />

        {/* Selection ring on the floor */}
        {isSelected && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 0.85, 64]} />
            <meshStandardMaterial
              color="#3b82f6"
              emissive="#3b82f6"
              emissiveIntensity={2}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}
      </group>

      {/* Name tag — positioned relative to avatar height (~1.8 units + small gap) */}
      <Text
        position={[0, 2.25, 0]}
        fontSize={0.18}
        color={isSelected ? '#3b82f6' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.018}
        outlineColor={isSelected ? '#ffffff' : '#1f2937'}
      >
        {student.firstName} {student.lastName[0]}.
      </Text>

      <Text
        position={[0, 2.0, 0]}
        fontSize={0.12}
        color={isSelected ? '#93c5fd' : '#9ca3af'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#111827"
      >
        {student.rollNumber || `#${index + 1}`}
      </Text>

      {/* Entry count badge */}
      {student.entryCount > 0 && (
        <group position={[0.55, 2.25, 0.1]}>
          <mesh>
            <circleGeometry args={[0.13, 32]} />
            <meshBasicMaterial color={isSelected ? '#3b82f6' : '#10b981'} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {student.entryCount}
          </Text>
        </group>
      )}
    </group>
  );
}

// ──────── Suspense loading placeholder inside Canvas ────────
function LoadingPlaceholder() {
  return (
    <Html center>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        background: 'rgba(26,27,36,0.9)', backdropFilter: 'blur(16px)',
        padding: '24px 32px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ width: 32, height: 32, border: '3px solid #3b82f6',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#9ca3af', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          Loading avatars...
        </p>
      </div>
    </Html>
  );
}

// ──────── Floor ────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.5} />
    </mesh>
  );
}

// ──────── Student Detail Panel ────────
function StudentDetailPanel({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminAPI.getStudentDetail(studentId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#1a1b24]/80 backdrop-blur-3xl shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-50 overflow-y-auto border-l border-white/10">
      <div className="sticky top-0 bg-[#1a1b24]/40 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between z-10">
        <h3 className="font-bold text-white tracking-wide uppercase text-sm">Student Analytics</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : detail ? (
        <div className="p-8 space-y-8">
          {/* Profile Header */}
          <div className="relative text-center p-6 bg-gradient-to-b from-blue-500/10 to-transparent rounded-3xl border border-blue-500/20">
            <div className={`mx-auto h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black ${
              (detail.student.gender || '').toLowerCase() === 'female'
                ? 'bg-gradient-to-br from-pink-500 to-rose-600'
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {detail.student.firstName[0]}{detail.student.lastName[0]}
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-white">
              {detail.student.firstName} {detail.student.lastName}
            </h2>
            <p className="text-sm text-blue-200 mt-1">{detail.student.email}</p>
            <div className="flex justify-center gap-3 mt-4">
              <span className="text-xs font-bold text-white bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 rounded-lg">
                {detail.student.rollNumber ? `ID: ${detail.student.rollNumber}` : 'No ID'}
              </span>
              <span className="text-xs font-bold text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                {detail.student.department || detail.student.className || 'No dept.'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <BookOpen className="h-5 w-5 text-blue-400" />, value: detail.summary.totalEntries, label: 'LOGS' },
              { icon: <Clock className="h-5 w-5 text-amber-400" />, value: `${detail.summary.totalHours}h`, label: 'HOURS' },
              { icon: <Award className="h-5 w-5 text-emerald-400" />, value: detail.summary.uniqueSkills, label: 'SKILLS' },
            ].map(({ icon, value, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">{icon}</div>
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Domains */}
          {Object.keys(detail.summary.domains).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-gray-400 tracking-widest mb-5">DOMAIN FOCUS</h4>
              <div className="space-y-4">
                {Object.entries(detail.summary.domains)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([domain, count]) => {
                    const max = Math.max(...Object.values(detail.summary.domains));
                    return (
                      <div key={domain}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="font-semibold text-blue-100">{domain}</span>
                          <span className="font-black text-blue-400">{count}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent entries */}
          {detail.entries.length > 0 ? (
            <div>
              <h4 className="text-xs font-bold text-gray-400 tracking-widest mb-4">RECENT ACTIVITY</h4>
              <div className="space-y-3">
                {detail.entries.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="group bg-[#232431]/60 hover:bg-[#2a2b3a] border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{entry.title}</h5>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[11px] text-gray-400">{entry.platform}</span>
                          <div className="w-1 h-1 rounded-full bg-gray-600" />
                          <span className="text-[11px] text-blue-300">{entry.domain}</span>
                        </div>
                        {entry.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {entry.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {entry.hoursSpent && (
                        <span className="flex-shrink-0 text-xl font-black text-white/20 group-hover:text-amber-400/50 transition-colors">
                          {entry.hoursSpent}h
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white/5 border border-white/5 rounded-3xl">
              <p className="text-sm text-gray-500">No activity recorded yet.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ──────── Main ClassroomView ────────
export default function ClassroomView() {
  const { className } = useParams<{ className: string }>();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!className) return;
    adminAPI.getStudentsByClass(decodeURIComponent(className))
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [className]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Compute a good default camera position based on how many students there are
  const cols = Math.min(students.length, 6);
  const rows = Math.ceil(students.length / cols);
  const spacing = 2.8;
  const sceneDepth = (rows - 1) * spacing;
  const camZ = Math.max(10, sceneDepth / 2 + 9);
  const camY = Math.max(5, rows * 2.5);

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-gradient-to-r from-gray-900 to-[#131317] p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-pink-500/5" />

        <div className="relative flex items-end gap-6">
          <Link
            to="/admin/classroom"
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl transition-all group"
          >
            <ArrowLeft className="h-6 w-6 text-white group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h4 className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-1">Classroom View</h4>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {decodeURIComponent(className || '')}
            </h1>
          </div>
        </div>

        <div className="relative flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
          <Users className="h-5 w-5 text-emerald-400" />
          <span className="text-2xl font-black text-white">{students.length}</span>
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase ml-1">Students</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-[#131317] rounded-3xl p-20 text-center border border-white/10">
          <div className="inline-flex p-6 bg-white/5 rounded-3xl mb-6">
            <Users className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No students in this class</h3>
          <p className="text-gray-500">No registered students found for this classroom.</p>
        </div>
      ) : (
        <div
          className="relative rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-[#0b0c10]"
          style={{ height: 'clamp(400px, 70vh, 800px)' }}
        >
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, camY, camZ], fov: 45 }}
            gl={{ 
              antialias: true, 
              alpha: false, 
              preserveDrawingBuffer: false,
              powerPreference: 'high-performance'
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#050810');
            }}
            onPointerMissed={() => setSelectedStudentId(null)}
          >
            <Suspense fallback={<LoadingPlaceholder />}>
              <color attach="background" args={['#050810']} />
              <fog attach="fog" args={['#050810', 15, 45]} />

              <ambientLight intensity={0.6} />
              <spotLight position={[0, 12, 0]} intensity={1.5} penumbra={1} color="#3b82f6" castShadow />
              <pointLight position={[-8, 8, -8]} intensity={1.8} color="#ec4899" />
              <pointLight position={[8, 4, 8]} intensity={1.2} color="#10b981" />
              <directionalLight position={[5, 10, 5]} intensity={0.8} color="#ffffff" />

              {/* Avatars — NO extra y-offset wrapper needed, normaliseClone places feet at y=0 */}
              {students.map((student, i) => (
                <StudentAvatar
                  key={student.id}
                  student={student}
                  index={i}
                  total={students.length}
                  onClick={() => setSelectedStudentId(
                    selectedStudentId === student.id ? null : student.id
                  )}
                  isSelected={selectedStudentId === student.id}
                />
              ))}

              <ContactShadows resolution={512} scale={40} blur={2.5} opacity={0.5} far={8} color="#000000" />
              <Floor />

              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2.05}
                minDistance={3}
                maxDistance={40}
                target={[0, 1, (rows - 1) * spacing / 2]}
              />
              <Environment preset="night" />
            </Suspense>
          </Canvas>

          {/* Legend */}
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <div className="bg-[#1a1b24]/80 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10 shadow-2xl">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Legend</p>
              <div className="flex flex-col gap-2">
                {[
                  { color: 'bg-blue-500', label: 'Male avatar' },
                  { color: 'bg-pink-500', label: 'Female avatar' },
                  { color: 'bg-emerald-500', label: 'Has entries' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="text-xs text-gray-300 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="absolute bottom-6 right-6 pointer-events-none">
            <div className="bg-[#1a1b24]/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/10 shadow-2xl flex items-center gap-3">
              <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <p className="text-xs text-white font-bold">Click a student to view details</p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="absolute top-5 right-5 pointer-events-none">
            <div className="bg-[#1a1b24]/80 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 flex items-center gap-2 shadow-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-xs font-bold text-blue-200 tracking-wider">LIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedStudentId && (
        <>
          <div
            className="fixed inset-0 bg-[#050810]/60 backdrop-blur-sm z-40"
            onClick={() => setSelectedStudentId(null)}
          />
          <StudentDetailPanel
            studentId={selectedStudentId}
            onClose={() => setSelectedStudentId(null)}
          />
        </>
      )}
    </div>
  );
}
