import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ChevronLeft, Calendar as CalendarIcon, Check, X } from 'lucide-react';

const ClassPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { classes, students, getAttendanceForDate, toggleAttendance } = useAppContext();

    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

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

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {classStudents.length === 0 ? (
                    <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhum aluno nesta turma ainda. Vá em Configurações para adicionar alunos.
                    </div>
                ) : (
                    <div>
                        <div style={{
                            padding: 'var(--spacing-md)',
                            background: '#f8fafc',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                            letterSpacing: '0.05em'
                        }}>
                            <span>Nome do Aluno</span>
                            <span>Situação</span>
                        </div>
                        {classStudents.map((student) => {
                            const isPresent = getStatus(student.id);
                            return (
                                <div key={student.id} style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: isPresent ? 'white' : '#fef2f2' // Light red bg if absent
                                }}>
                                    <span style={{ fontWeight: 500, color: isPresent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                        {student.name}
                                    </span>

                                    <button
                                        onClick={() => toggleAttendance(currentClass.id, student.id, date)}
                                        className="btn"
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 'var(--radius-full)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            backgroundColor: isPresent ? '#dcfce7' : '#fee2e2',
                                            color: isPresent ? '#166534' : '#991b1b',
                                            border: `1px solid ${isPresent ? '#bbf7d0' : '#fecaca'}`,
                                            minWidth: '100px',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {isPresent ? (
                                            <>
                                                <Check size={16} /> Presente
                                            </>
                                        ) : (
                                            <>
                                                <X size={16} /> Ausente
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassPage;
