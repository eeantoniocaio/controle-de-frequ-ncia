import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Users, ChevronRight } from 'lucide-react';

const HomePage: React.FC = () => {
    const { classes, students } = useAppContext();

    const getStudentCount = (classId: string) => {
        return students.filter(s => s.classId === classId).length;
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <header className="page-header">
                <h2 className="page-title">Minhas Turmas</h2>
            </header>

            {classes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                    <p>Nenhuma turma encontrada.</p>
                    <Link to="/settings" className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                        Criar Turma
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {classes.map(cls => (
                        <Link key={cls.id} to={`/class/${cls.id}`} style={{ textDecoration: 'none' }}>
                            <div className="card" style={{
                                padding: 'var(--spacing-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'transform 0.2s',
                                cursor: 'pointer'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--spacing-xs)' }}>{cls.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <Users size={16} />
                                        <span>{getStudentCount(cls.id)} Alunos</span>
                                    </div>
                                </div>
                                <ChevronRight color="var(--text-secondary)" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;
