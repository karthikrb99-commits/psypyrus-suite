import { useCallback, useState, useEffect } from 'react';
import { Database } from '../../services/db';
import { GeminiService } from '../../services/ai';

export function CBTGoalPlanner({
    activePatientId
}) {
    const [goalTitle, setGoalTitle] = useState('Improve sleep pacing routines / CBT-I');
    const [goalDesc, setGoalDesc] = useState('Complete daily abdominal breathing guides and sleep notebook.');
    const [hwInput, setHwInput] = useState('');
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [planResult, setPlanResult] = useState('');
    const [tasks, setTasks] = useState([]);

    const refreshTasks = useCallback(() => {
        setTasks(Database.getHomework(activePatientId));
    }, [activePatientId]);

    useEffect(() => {
        refreshTasks();
        window.addEventListener('psypyrus_db_change', refreshTasks);
        return () => window.removeEventListener('psypyrus_db_change', refreshTasks);
    }, [refreshTasks]);

    const handleFormulateSMART = async () => {
        const title = goalTitle.trim();
        if (!title) return;

        setLoadingPlan(true);
        setPlanResult('');

        const prompt = `Convert this basic mental health therapy goal into a comprehensive clinical treatment plan following clinical standards:\n\nGoal: "${title}"\nContext: "${goalDesc}"\n\nOutput:\n1. Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) Goal configuration.\n2. Evidence-Based Clinical Interventions.\n3. Concrete homework assignments.\n4. Progress tracking milestones.`;

        try {
            const result = await GeminiService.callGemini(prompt, "You are a cognitive behavioral therapist (CBT) treatment planner.");
            setPlanResult(result);

            Database.insertClinicalNote({
                patientId: activePatientId,
                title: `Treatment Plan: ${title}`,
                noteType: "PLAN",
                bodyJson: result
            });
        } catch (e) {
            alert(`Error: ${e.message}`);
        } finally {
            setLoadingPlan(false);
        }
    };

    const handleAssignHomework = () => {
        const desc = hwInput.trim();
        if (!desc) return;

        Database.insertHomework({
            patientId: activePatientId,
            description: desc
        });
        setHwInput('');
    };

    const handleHwKeyPress = (e) => {
        if (e.key === 'Enter') handleAssignHomework();
    };

    const handleToggleHomework = (taskId) => {
        Database.toggleHomework(taskId);
    };

    const handleDeleteHomework = (taskId) => {
        Database.deleteHomework(taskId);
    };

    return (
        <div className="screen-container active" id="screen-planner">
            <div className="section-header-block">
                <i className="fa-solid fa-calendar-check"></i>
                <h2>CBT Treatment Planner Core</h2>
            </div>

            <div className="workspace-card">
                <div className="card-title-bar">
                    <h3>Design SMART Therapy Goals:</h3>
                </div>
                <div className="form-field-group">
                    <label className="form-label">Base Goals target:</label>
                    <input 
                        type="text" 
                        className="input-text-field" 
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                    />
                </div>
                <div className="form-field-group">
                    <label className="form-label">Context & therapeutic notes:</label>
                    <input 
                        type="text" 
                        className="input-text-field" 
                        value={goalDesc}
                        onChange={(e) => setGoalDesc(e.target.value)}
                    />
                </div>
                <button 
                    className="action-button-btn" 
                    id="planner-formulate-btn" 
                    style={{ width: '100%' }}
                    onClick={handleFormulateSMART}
                    disabled={loadingPlan}
                >
                    {loadingPlan ? (
                        <>
                            <span className="loader-dual-ring" style={{ marginRight: '8px' }}></span>
                            Autoplanning...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-brain"></i> Auto-Formulate SMART Details
                        </>
                    )}
                </button>
            </div>

            {planResult && (
                <div id="planner-result-card" className="workspace-card">
                    <div className="card-title-bar">
                        <h3>AI Formulated Therapy Roadmap:</h3>
                    </div>
                    <div className="ai-formatted-report-block">
                        <pre className="report-markdown-output" id="planner-result-text" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {planResult}
                        </pre>
                    </div>
                </div>
            )}

            {/* Clinician Homework Management */}
            <div className="workspace-card">
                <div className="card-title-bar">
                    <h3 style={{ color: 'var(--color-primary)' }}>Assign Homework Task for Active Subject:</h3>
                </div>
                <div className="form-field-group">
                    <label className="form-label">Homework description:</label>
                    <input 
                        type="text" 
                        className="input-text-field" 
                        id="planner-hw-input" 
                        placeholder="e.g. Complete sleep tracking, log anxiety triggers..."
                        value={hwInput}
                        onChange={(e) => setHwInput(e.target.value)}
                        onKeyPress={handleHwKeyPress}
                    />
                </div>
                <button 
                    className="action-button-btn" 
                    id="planner-assign-hw-btn" 
                    style={{ float: 'right' }}
                    onClick={handleAssignHomework}
                >
                    <i className="fa-solid fa-plus"></i> Assign Homework
                </button>
                <div style={{ clear: 'both' }}></div>
            </div>

            <div className="card-title-bar" style={{ marginTop: '24px' }}>
                <h3>Active Assigned Homework Checklist</h3>
            </div>
            
            <div id="planner-homework-checklist-container">
                {tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        No homework tasks currently assigned.
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className="homework-list-item">
                            <label className={`homework-item-label ${task.isCompleted ? 'completed' : ''}`}>
                                <input 
                                    type="checkbox" 
                                    className="checkbox-control planner-hw-check-chk" 
                                    checked={task.isCompleted}
                                    onChange={() => handleToggleHomework(task.id)}
                                />
                                <span>{task.description}</span>
                            </label>
                            <button 
                                className="homework-delete-btn planner-hw-delete-btn"
                                onClick={() => handleDeleteHomework(task.id)}
                            >
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
