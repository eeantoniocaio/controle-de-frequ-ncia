import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, Calendar as CalendarIcon, Check, X, Plus } from 'lucide-react';

const ClassPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { classes, students, getAttendanceForDate, toggleAttendance, addStudent, loading } = useAppContext();

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ marginBottom: 'var(--spacing-md)' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Carregando dados da turma...</p>
                </div>
            </div>
        );
    }

    const currentClass = classes.find(c => c.id === classId);
    const classStudents = students.filter(s => s.classId === classId);
    const attendanceRecord = classId ? getAttendanceForDate(classId, date) : undefined;

    if (!currentClass) {
        return <div className="container">Turma não encontrada</div>;
    }

    const getStatus = (studentId: string) => {
        // Default is PRESENT (true) if no record exists for this student on this day
        if (!attendanceRecord) return true;
        const status = attendanceRecord.records[studentId];
        return status !== false; // If explicitly false, then absent. Undefined or true = present.
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
            <header className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <ChevronLeft size={16} /> Voltar para Turmas
                </Link>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="page-title">{currentClass.name}</h2>
                    <div style={{ position: 'relative' }}>
                        <CalendarIcon size={20} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '40px', width: 'auto' }}
                        />
                    </div>
                </div>
            </header>

            <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'transparent', boxShadow: 'none' }}>
                {classStudents.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhum aluno nesta turma ainda. Vá em Configurações para adicionar alunos.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {classStudents.map((student) => {
                            const isPresent = getStatus(student.id);
                            return (
                                <div key={student.id} className="card" style={{
                                    padding: 'var(--spacing-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
                                    marginBottom: 0
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                        {student.name}
                                    </span>

                                    <button
                                        onClick={() => toggleAttendance(currentClass.id, student.id, date)}
                                        className="btn"
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: isPresent ? 'var(--accent-green)' : '#fee2e2',
                                            color: isPresent ? '#064e3b' : '#991b1b',
                                            minWidth: '110px'
                                        }}
                                    >
                                        {isPresent ? (
                                            <>
                                                <Check size={18} strokeWidth={2.5} /> Presente
                                            </>
                                        ) : (
                                            <>
                                                <X size={18} strokeWidth={2.5} /> Ausente
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Add Student Section */}
            <div className="card" style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <Plus size={20} color="var(--text-secondary)" />
                <input
                    type="text"
                    placeholder="Adicionar novo aluno..."
                    className="input"
                    style={{ border: 'none', padding: '0', boxShadow: 'none', background: 'transparent' }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const target = e.currentTarget;
                            if (target.value.trim()) {
                                addStudent(classId!, target.value.trim());
                                target.value = '';
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default ClassPage;
