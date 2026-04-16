import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import type { StudentSummary, StudentDetail } from '../../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, useGLTF, ContactShadows, Html } from '@react-three/drei';
import { ArrowLeft, Loader2, X, BookOpen, Clock, Award, Users, Info } from 'lucide-react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// Preload models for instantaneous rendering
useGLTF.preload('/Boy.glb');
useGLTF.preload('/Girl.glb');

// ──────── 3D Student GLB Component ────────
function StudentAvatar({ student, index, total, onClick, isSelected }: {
  student: StudentSummary; index: number; total: number; onClick: () => void; isSelected: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const gender = (student.gender || '').toLowerCase();
  const isMale = gender !== 'female';
  
  // Conditionally load the exact model with safety check
  const modelUrl = isMale ? '/Boy.glb' : '/Girl.glb';
  const { scene } = useGLTF(modelUrl) as any;
  
  // Clone the scene graph using SkeletonUtils to reuse memory across multiple student avatars
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Grid layout for classroom positioning
  const cols = Math.min(total, 6);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 3.2; 
  const x = (col - (cols - 1) / 2) * spacing;
  const z = row * spacing;

  // Cinematic Procedural Animation
  const timeOffset = useRef(Math.random() * Math.PI * 2);
  useFrame((state) => {
    if (group.current) {
      if (isSelected) {
        // Active student: Floats higher and rotates slowly to show off the 3D model
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05, 0.1);
        group.current.rotation.y += 0.005;
      } else {
        // Idle student: Subtle breathing levitation
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, Math.sin(state.clock.elapsedTime + timeOffset.current) * 0.03, 0.1);
        // Spin back forward
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.05);
      }
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Interactive Avatar Group */}
      <group
        ref={group}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <primitive object={clone} scale={[1.3, 1.3, 1.3]} />
        
        {/* Selection Aura */}
        {isSelected && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.0, 1.2, 64]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* Floating Holographic UI Tags */}
      <Text
        position={[0, 2.7, 0]}
        fontSize={0.22}
        color={isSelected ? "#3b82f6" : "#ffffff"}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter.woff2"
        outlineWidth={0.02}
        outlineColor={isSelected ? "#ffffff" : "#1f2937"}
      >
        {student.firstName} {student.lastName[0]}.
      </Text>

      <Text
        position={[0, 2.45, 0]}
        fontSize={0.14}
        color={isSelected ? "#93c5fd" : "#9ca3af"}
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter.woff2"
        outlineWidth={0.015}
        outlineColor="#111827"
      >
        {student.rollNumber || `#${index + 1}`}
      </Text>
      
      {student.entryCount > 0 && (
        <group position={[0.7, 2.7, 0.1]}>
          <mesh>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial color={isSelected ? "#3b82f6" : "#10b981"} />
          </mesh>
          <Text position={[0, 0, 0.01]} fontSize={0.12} color="white" anchorX="center" anchorY="middle"
            font="/fonts/Inter.woff2">
            {student.entryCount}
          </Text>
        </group>
      )}
    </group>
  );
}

function LoadingPlaceholder() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 bg-gray-900/80 backdrop-blur-xl px-8 py-6 rounded-3xl border border-white/10 shadow-2xl">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Initialising neural nodes...</p>
      </div>
    </Html>
  );
}

// ──────── Floor ────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.5} />
    </mesh>
  );
}

// ──────── Glassmorphic Detail Panel ────────
function StudentDetailPanel({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await adminAPI.getStudentDetail(studentId);
        setDetail(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#1a1b24]/80 backdrop-blur-3xl shadow-[-20px_0_60px_rgba(0,0,0,0.5)] z-50 overflow-y-auto border-l border-white/10 transition-all">
      <div className="sticky top-0 bg-[#1a1b24]/40 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between z-10">
        <h3 className="font-bold text-white tracking-wide uppercase text-sm">Neural Analytics</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 h-full">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : detail ? (
        <div className="p-8 space-y-8">
          {/* Holographic Profile Header */}
          <div className="relative text-center p-6 bg-gradient-to-b from-blue-500/10 to-transparent rounded-3xl border border-blue-500/20">
            <div className={`mx-auto h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-[0_0_30px_rgba(59,130,246,0.3)] ${
              detail.student.gender === 'female' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {detail.student.firstName[0]}{detail.student.lastName[0]}
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-white">
              {detail.student.firstName} {detail.student.lastName}
            </h2>
            <p className="text-sm text-blue-200 mt-1">{detail.student.email}</p>
            <div className="flex justify-center gap-3 mt-4">
              <span className="text-xs font-bold text-white bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 rounded-lg backdrop-blur-md">
                ID: {detail.student.rollNumber}
              </span>
              <span className="text-xs font-bold text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                {detail.student.department || detail.student.className}
              </span>
            </div>
          </div>

          {/* Telemetry Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{detail.summary.totalEntries}</p>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">LOGS</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
              <Clock className="h-5 w-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{detail.summary.totalHours}h</p>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">HOURS</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
              <Award className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-white">{detail.summary.uniqueSkills}</p>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-1">SKILLS</p>
            </div>
          </div>

          {/* Deep Focus Domains */}
          {Object.keys(detail.summary.domains).length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-gray-400 tracking-widest mb-5">SPECTRAL DOMAIN FOCUS</h4>
              <div className="space-y-4">
                {Object.entries(detail.summary.domains)
                  .sort(([,a], [,b]) => b - a)
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
                          <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-1000"
                            style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Neural Activity Logs */}
          {detail.entries.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 tracking-widest mb-4 px-2">RECENT ACTIVITY</h4>
              <div className="space-y-3">
                {detail.entries.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="group relative bg-[#232431]/60 hover:bg-[#2a2b3a] border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 transition-all">
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
          )}

          {detail.entries.length === 0 && (
            <div className="text-center py-10 bg-white/5 border border-white/5 rounded-3xl">
              <p className="text-sm text-gray-500">No telemetry data recorded.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ──────── Main Cinematic ClassroomView ────────
export default function ClassroomView() {
  const { className } = useParams<{ className: string }>();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!className) return;
      try {
        const data = await adminAPI.getStudentsByClass(decodeURIComponent(className));
        setStudents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [className]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Stitch Neural-Architect Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 bg-gradient-to-r from-gray-900 to-[#131317] p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Procedural Grid Background Replacement */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-pink-500/5"></div>
        
        <div className="relative flex items-end gap-6">
          <Link to="/admin/dashboard"
            className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl transition-all group">
            <ArrowLeft className="h-6 w-6 text-white group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h4 className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-1">Sector View</h4>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {decodeURIComponent(className || '')}
            </h1>
          </div>
        </div>
        <div className="relative flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md">
          <Users className="h-5 w-5 text-emerald-400" />
          <span className="text-2xl font-black text-white">{students.length}</span>
          <span className="text-xs font-bold tracking-widest text-gray-400 uppercase ml-1">Nodes</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-[#131317] rounded-3xl p-20 text-center border border-white/10">
          <div className="inline-flex p-6 bg-white/5 rounded-3xl mb-6">
            <Users className="h-12 w-12 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active neural nodes</h3>
          <p className="text-gray-500">This class currently holds no registered students.</p>
        </div>
      ) : (
        /* Thematic 3D Canvas Void */
        <div className="relative rounded-3xl overflow-hidden border border-gray-800 shadow-2xl bg-[#0b0c10]" style={{ height: 'clamp(400px, 70vh, 800px)' }}>
          
          <Canvas
            shadows
            camera={{ position: [0, 6, 14], fov: 45 }}
            className="cursor-move"
            onError={(e) => console.error('Canvas Error:', e)}
          >
            <Suspense fallback={<LoadingPlaceholder />}>
              <color attach="background" args={['#050810']} />
              <fog attach="fog" args={['#050810', 10, 40]} />
              
              <ambientLight intensity={0.5} />
              
              {/* Cinematic Studio Lighting */}
              <spotLight position={[0, 15, 0]} intensity={1.5} penumbra={1} color="#3b82f6" castShadow />
              <pointLight position={[-10, 10, -10]} intensity={2} color="#ec4899" />
              <pointLight position={[10, 5, 10]} intensity={1.5} color="#10b981" />
              
              <group position={[0, 0.5, 0]}>
                {students.map((student, i) => (
                  <StudentAvatar
                    key={student.id}
                    student={student}
                    index={i}
                    total={students.length}
                    onClick={() => setSelectedStudentId(student.id)}
                    isSelected={selectedStudentId === student.id}
                  />
                ))}
              </group>
              
              {/* Reflective Ground for High Fidelity */}
              <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.4} far={10} color="#000000" />
              <Floor />
              
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={5}
                maxDistance={30}
              />
              <Environment preset="night" />
            </Suspense>
          </Canvas>

          {/* Cyber Overlay Legend */}
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <div className="bg-[#1a1b24]/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Model Attributes</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-md bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-xs text-gray-300 font-bold uppercase tracking-wide">Male Avatar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-md bg-pink-500/20 border border-pink-500/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  </div>
                  <span className="text-xs text-gray-300 font-bold uppercase tracking-wide">Female Avatar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs text-gray-300 font-bold uppercase tracking-wide">Telemetry Logs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 pointer-events-none">
            <div className="bg-[#1a1b24]/80 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 shadow-2xl flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                <Info className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Interaction Hint</p>
                <p className="text-xs text-white font-bold">Click a node to view telemetry</p>
              </div>
            </div>
          </div>

          <div className="absolute top-6 right-6 pointer-events-none">
            <div className="bg-[#1a1b24]/80 backdrop-blur-xl rounded-full px-5 py-2.5 border border-white/10 flex items-center gap-2 shadow-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="text-xs font-bold text-blue-200 tracking-wider">LIVE NODE TRACKING</span>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in Overlay Panel */}
      {selectedStudentId && (
        <>
          <div className="fixed inset-0 bg-[#050810]/60 backdrop-blur-sm z-40 transition-all opacity-100" onClick={() => setSelectedStudentId(null)} />
          <StudentDetailPanel studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
        </>
      )}
    </div>
  );
}
