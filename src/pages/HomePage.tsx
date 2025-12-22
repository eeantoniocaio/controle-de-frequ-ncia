import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Users, ChevronRight } from 'lucide-react';

const HomePage: React.FC = () => {
    const { classes, students } = useAppContext();

    const getStudentCount = (classId: string) => {
        return students.filter(s => s.classId === classId).length;
    };

    const accentColors = [
        'var(--accent-pink)',
        'var(--accent-yellow)',
        'var(--accent-blue)',
        'var(--accent-green)',
        'var(--accent-purple)'
    ];

    return (
        <div>
            <header className="page-header" style={{ marginBottom: 'var(--spacing-md)' }}>
                <h2 className="page-title">Minhas Turmas</h2>
            </header>

            {classes.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: 'var(--spacing-md)' }}>Nenhuma turma encontrada.</p>
                    <Link to="/settings" className="btn btn-primary">
                        Criar Turma
                    </Link>
                </div>
            ) : (
                <div className="class-grid">
                    {classes.map((cls) => {
                        const name = cls.name.toUpperCase();
                        let bg = 'var(--card-bg)';

                        // Specific mapping based on user request
                        if (name.includes('6º') || name.includes('6 ')) bg = '#FFC0CB'; // Pink
                        else if (name.includes('7º') || name.includes('7 ')) bg = '#FFD580'; // Orange/Yellow
                        else if (name.includes('8º') || name.includes('8 ')) bg = '#ADD8E6'; // Blue
                        else if (name.includes('9º') || name.includes('9 ')) bg = '#90EE90'; // Green
                        else if (name.includes('1º') || name.includes('1 ')) bg = '#E6E6FA'; // Purple
                        else if (name.includes('2º') || name.includes('2 ')) bg = '#FFDEE9'; // Soft Pink
                        else if (name.includes('3º') || name.includes('3 ')) bg = '#FFFACD'; // Lemon Chiffon
                        else if (name.includes('ACDA')) bg = '#E0F2F1'; // Teal-ish
                        else if (name.includes('FANFARRA')) bg = '#F3E5F5'; // Lavender
                        else {
                            // Fallback to recycled colors for unknown types
                            const hash = name.length + name.charCodeAt(0);
                            bg = accentColors[hash % accentColors.length];
                        }

                        return (
                            <Link key={cls.id} to={`/class/${cls.id}`}>
                                <div className="card" style={{
                                    backgroundColor: bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    color: '#111' /* Force dark text on pastels */
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', fontWeight: 700 }}>{cls.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, fontSize: '0.9rem', fontWeight: 500 }}>
                                            <Users size={18} />
                                            <span>{getStudentCount(cls.id)} Alunos</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(255,255,255,0.4)',
                                        borderRadius: '50%',
                                        padding: '8px',
                                        display: 'flex'
                                    }}>
                                        <ChevronRight size={24} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HomePage;
