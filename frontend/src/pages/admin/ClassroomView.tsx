import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import type { StudentSummary, StudentDetail } from '../../types';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, useGLTF } from '@react-three/drei';
import { ArrowLeft, Loader2, X, BookOpen, Clock, Award, Users } from 'lucide-react';
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
  const isMale = student.gender !== 'female';
  
  const { scene } = useGLTF(isMale ? '/Boy.glb' : '/Girl.glb') as any;
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  const cols = Math.min(total, 6);
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 3.2; 
  const x = (col - (cols - 1) / 2) * spacing;
  const z = row * spacing;

  const timeOffset = useRef(Math.random() * Math.PI * 2);
  useFrame((state) => {
    if (group.current) {
      if (isSelected) {
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05, 0.1);
        group.current.rotation.y += 0.005;
      } else {
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, Math.sin(state.clock.elapsedTime + timeOffset.current) * 0.03, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.05);
      }
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
        <primitive object={clone} scale={[1.3, 1.3, 1.3]} />
        {isSelected && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.0, 1.2, 64]} />
            <meshBasicMaterial color="#C9A84C" transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      <Text
        position={[0, 2.7, 0]}
        fontSize={0.22}
        color={isSelected ? "#C9A84C" : "#F5F0E8"}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD_Wv3u5d2FTrRIsFpe21q_0tMwTM8A.woff2"
      >
        {student.firstName} {student.lastName[0]}.
      </Text>

      <Text
        position={[0, 2.45, 0]}
        fontSize={0.14}
        color={isSelected ? "#F5F0E8" : "#9ca3af"}
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/dmsans/v14/rP2FpZwyvRsoMswe9Q.woff2"
      >
        {student.rollNumber || `#${index + 1}`}
      </Text>
    </group>
  );
}

// ──────── Floor ────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  );
}

// ──────── Flat Solid Target Panel ────────
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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#0F0E0C] z-50 overflow-y-auto border-l border-[#C9A84C]">
      <div className="sticky top-0 bg-[#0F0E0C] border-b border-[#C9A84C] px-10 py-8 flex items-center justify-between z-10">
        <h3 className="font-serif text-[#C9A84C] tracking-[0.2em] uppercase text-sm">Registry Target</h3>
        <button onClick={onClose} className="p-2 hover:bg-[#C9A84C] group transition-colors border border-transparent hover:border-[#C9A84C]">
          <X className="h-5 w-5 text-[#F5F0E8] group-hover:text-[#0F0E0C]" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 h-full">
          <Loader2 className="h-8 w-8 text-[#C9A84C] animate-spin" />
        </div>
      ) : detail ? (
        <div className="p-10 space-y-12">
          {/* Profile Header */}
          <div className="text-center p-8 border border-[#C9A84C]">
            <div className="mx-auto h-20 w-20 border border-[#C9A84C] flex items-center justify-center text-[#C9A84C] text-2xl font-serif">
              {detail.student.firstName[0]}{detail.student.lastName[0]}
            </div>
            <h2 className="mt-6 text-3xl font-serif text-[#F5F0E8]">
              {detail.student.firstName} {detail.student.lastName}
            </h2>
            <p className="text-sm text-[#F5F0E8]/50 mt-2 font-sans">{detail.student.email}</p>
            <div className="flex justify-center gap-4 mt-6">
              <span className="text-xs font-semibold text-[#F5F0E8] border border-[#F5F0E8]/30 px-3 py-1 uppercase tracking-widest">
                ID: {detail.student.rollNumber}
              </span>
              <span className="text-xs font-semibold text-[#C9A84C] border border-[#C9A84C] px-3 py-1 uppercase tracking-widest">
                {detail.student.department || detail.student.className}
              </span>
            </div>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-3 gap-6">
            <div className="border border-[#C9A84C]/30 p-6 text-center">
              <BookOpen className="h-5 w-5 text-[#C9A84C] mx-auto mb-4" />
              <p className="text-3xl font-serif text-[#F5F0E8]">{detail.summary.totalEntries}</p>
              <p className="text-[10px] text-[#F5F0E8]/50 font-semibold tracking-[0.2em] mt-2">ENTRIES</p>
            </div>
            <div className="border border-[#C9A84C]/30 p-6 text-center">
              <Clock className="h-5 w-5 text-[#C9A84C] mx-auto mb-4" />
              <p className="text-3xl font-serif text-[#F5F0E8]">{detail.summary.totalHours}h</p>
              <p className="text-[10px] text-[#F5F0E8]/50 font-semibold tracking-[0.2em] mt-2">HOURS</p>
            </div>
            <div className="border border-[#C9A84C]/30 p-6 text-center">
              <Award className="h-5 w-5 text-[#C9A84C] mx-auto mb-4" />
              <p className="text-3xl font-serif text-[#F5F0E8]">{detail.summary.uniqueSkills}</p>
              <p className="text-[10px] text-[#F5F0E8]/50 font-semibold tracking-[0.2em] mt-2">SKILLS</p>
            </div>
          </div>

          {/* Focus Domains */}
          {Object.keys(detail.summary.domains).length > 0 && (
            <div className="border border-[#C9A84C]/30 p-8">
              <h4 className="text-xs font-semibold text-[#F5F0E8]/50 tracking-[0.2em] mb-6 uppercase">Focus Domains</h4>
              <div className="space-y-6">
                {Object.entries(detail.summary.domains)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([domain, count]) => {
                    const max = Math.max(...Object.values(detail.summary.domains));
                    return (
                      <div key={domain}>
                        <div className="flex justify-between text-xs mb-3 font-semibold uppercase tracking-widest text-[#F5F0E8]">
                          <span>{domain}</span>
                          <span className="text-[#C9A84C]">{count}</span>
                        </div>
                        <div className="h-[2px] bg-[#C9A84C]/10 w-full">
                          <div className="h-full bg-[#C9A84C]" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {detail.entries.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#F5F0E8]/50 tracking-[0.2em] uppercase mb-6">Recent Activity</h4>
              <div className="space-y-4">
                {detail.entries.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="border border-[#C9A84C]/30 p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-lg font-serif text-[#F5F0E8] truncate">{entry.title}</h5>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] text-[#C9A84C] tracking-widest uppercase font-semibold">{entry.platform}</span>
                          <div className="w-1 h-1 bg-[#F5F0E8]/20" />
                          <span className="text-[10px] text-[#F5F0E8]/50 tracking-widest uppercase font-semibold">{entry.domain}</span>
                        </div>
                        {entry.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {entry.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="text-[10px] font-semibold text-[#F5F0E8]/70 border border-[#F5F0E8]/30 px-2 py-1 uppercase tracking-wider">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {entry.hoursSpent && (
                        <span className="text-xl font-serif text-[#C9A84C]">
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
            <div className="text-center py-12 border border-[#C9A84C]/20">
              <p className="text-sm text-[#F5F0E8]/50 font-sans">No registry history found.</p>
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
        <Loader2 className="h-10 w-10 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-[#0F0E0C] p-12 border border-[#C9A84C]">
        <div className="flex items-end gap-8">
          <Link to="/admin/dashboard" className="p-4 border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#0F0E0C] transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h4 className="text-xs font-semibold text-[#F5F0E8]/50 tracking-[0.2em] uppercase mb-3">Sector Register</h4>
            <h1 className="text-4xl md:text-5xl font-serif text-[#F5F0E8]">
              {decodeURIComponent(className || '')}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 border border-[#F5F0E8]/20 px-6 py-4">
          <Users className="h-5 w-5 text-[#C9A84C]" />
          <span className="text-2xl font-serif text-[#F5F0E8]">{students.length}</span>
          <span className="text-xs font-semibold tracking-widest text-[#F5F0E8]/50 uppercase ml-2">Registered</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-[#0F0E0C] p-24 text-center border border-[#C9A84C]/50">
          <div className="inline-flex p-6 border border-[#F5F0E8]/10 mb-8">
            <Users className="h-12 w-12 text-[#F5F0E8]/30" />
          </div>
          <h3 className="text-2xl font-serif text-[#F5F0E8] mb-4">No Scholars Assigned</h3>
          <p className="text-[#F5F0E8]/50 font-sans">This sector is completely empty.</p>
        </div>
      ) : (
        /* Thematic 3D Canvas Void */
        <div className="relative border border-[#C9A84C]" style={{ height: '750px', backgroundColor: '#000000' }}>
          
          <Canvas
            camera={{ position: [0, 8, 18], fov: 40 }}
            className="cursor-crosshair"
          >
            <Suspense fallback={null}>
              <color attach="background" args={['#000000']} />
              
              <ambientLight intensity={1.5} />
              
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
              
              <Floor />
              
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={5}
                maxDistance={35}
              />
              <Environment preset="studio" />
            </Suspense>
          </Canvas>

          {/* Legend */}
          <div className="absolute bottom-8 left-8 pointer-events-none">
            <div className="bg-[#0F0E0C] p-6 border border-[#C9A84C]/50">
              <p className="text-[10px] font-semibold text-[#F5F0E8]/50 tracking-[0.2em] uppercase mb-4">Identification</p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 border border-[#C9A84C] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#C9A84C]" />
                  </div>
                  <span className="text-xs text-[#F5F0E8] font-semibold uppercase tracking-widest">Male Avatar</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 border border-[#F5F0E8] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#F5F0E8]" />
                  </div>
                  <span className="text-xs text-[#F5F0E8] font-semibold uppercase tracking-widest">Female Avatar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Overlay */}
      {selectedStudentId && (
        <>
          <div className="fixed inset-0 bg-[#000000]/80 z-40" onClick={() => setSelectedStudentId(null)} />
          <StudentDetailPanel studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
        </>
      )}
    </div>
  );
}
