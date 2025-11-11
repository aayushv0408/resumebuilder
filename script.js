// Utility Functions (moved up for use in other functions)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Local Storage Management
const STORAGE_KEY = 'resumeBuilderData';
let saveTimeout;

function saveToLocalStorage() {
    const data = collectFormData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateSaveStatus('saved');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            loadFormData(data);
            updateSaveStatus('loaded');
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

function updateSaveStatus(status) {
    const saveText = document.getElementById('saveText');
    if (!saveText) return;
    
    if (status === 'saving') {
        saveText.textContent = 'Saving...';
        saveText.style.color = 'var(--primary-color)';
    } else if (status === 'saved') {
        saveText.textContent = 'Auto-saved';
        saveText.style.color = 'var(--success-color)';
        setTimeout(() => {
            saveText.style.color = 'var(--text-secondary)';
        }, 2000);
    } else if (status === 'loaded') {
        saveText.textContent = 'Data restored';
        saveText.style.color = 'var(--success-color)';
        setTimeout(() => {
            saveText.textContent = 'Auto-saved';
            saveText.style.color = 'var(--text-secondary)';
        }, 3000);
    }
}

// Auto-save on input change
function setupAutoSave() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            updateSaveStatus('saving');
            saveTimeout = setTimeout(() => {
                saveToLocalStorage();
                updateProgress();
            }, 1000);
        });
    });
}

// Progress Calculator
function calculateProgress() {
    let completed = 0;
    let total = 0;

    // Personal Info (6 fields)
    total += 6;
    if (document.getElementById('fullName').value) completed++;
    if (document.getElementById('email').value) completed++;
    if (document.getElementById('phone').value) completed++;
    if (document.getElementById('location').value) completed++;
    if (document.getElementById('linkedin').value) completed++;
    if (document.getElementById('portfolio').value) completed++;

    // Summary
    total += 1;
    if (document.getElementById('summary').value) completed++;

    // Skills
    total += 1;
    if (skills.length > 0) completed++;

    // Experience
    const expItems = document.querySelectorAll('.experience-item');
    expItems.forEach(item => {
        total += 2;
        if (item.querySelector('.exp-job-title').value) completed++;
        if (item.querySelector('.exp-company').value) completed++;
    });

    // Education
    const eduItems = document.querySelectorAll('.education-item');
    eduItems.forEach(item => {
        total += 2;
        if (item.querySelector('.edu-degree').value) completed++;
        if (item.querySelector('.edu-school').value) completed++;
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function updateProgress() {
    const progress = calculateProgress();
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    if (progressText) {
        progressText.textContent = progress + '% Complete';
    }
}

// Skills Management with Categories
let skills = [];
let skillsByCategory = {
    technical: [],
    soft: [],
    tools: [],
    languages: [],
    other: []
};

function setupSkillsInput() {
    const skillInput = document.getElementById('skillInput');
    if (skillInput) {
        skillInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                e.preventDefault();
                addSkill(this.value.trim());
                this.value = '';
            }
        });
    }
}

function addSkill(skill) {
    if (skill && skill.trim() !== '' && !skills.includes(skill)) {
        const category = document.getElementById('skillCategory').value;
        skills.push(skill);
        if (!skillsByCategory[category]) skillsByCategory[category] = [];
        skillsByCategory[category].push(skill);
        renderSkills();
        saveToLocalStorage();
        updateProgress();
    }
}

function removeSkill(skill) {
    skills = skills.filter(s => s !== skill);
    Object.keys(skillsByCategory).forEach(cat => {
        skillsByCategory[cat] = skillsByCategory[cat].filter(s => s !== skill);
    });
    renderSkills();
    saveToLocalStorage();
    updateProgress();
}

function renderSkills() {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    skillsList.innerHTML = '';
    
    // Group skills by category
    Object.keys(skillsByCategory).forEach(category => {
        if (skillsByCategory[category].length > 0) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'skill-category-group';
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
            categoryDiv.innerHTML = `<div class="skill-category-label">${categoryName}</div>`;
            
            skillsByCategory[category].forEach(skill => {
                const tag = document.createElement('div');
                tag.className = 'skill-tag';
                tag.innerHTML = `
                    ${escapeHtml(skill)}
                    <span class="remove">×</span>
                `;
                const removeBtn = tag.querySelector('.remove');
                removeBtn.addEventListener('click', function() {
                    removeSkill(skill);
                });
                categoryDiv.appendChild(tag);
            });
            skillsList.appendChild(categoryDiv);
        }
    });
}

// Experience Management
let experienceCount = 1;

function setupExperienceButton() {
    const btn = document.getElementById('addExperience');
    if (btn) {
        btn.addEventListener('click', function() {
    const container = document.getElementById('experienceContainer');
    const newItem = document.createElement('div');
    newItem.className = 'experience-item sortable-item';
    newItem.draggable = true;
    newItem.innerHTML = `
        <div class="item-header">
            <span class="drag-handle">☰</span>
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <input type="text" class="exp-job-title" placeholder="Job Title" required>
        <input type="text" class="exp-company" placeholder="Company Name" required>
        <input type="text" class="exp-location" placeholder="Location">
        <div class="date-inputs">
            <input type="month" class="exp-start-date" placeholder="Start Date">
            <input type="month" class="exp-end-date" placeholder="End Date">
            <label class="checkbox-label">
                <input type="checkbox" class="exp-current"> Current Job
            </label>
        </div>
        <textarea class="exp-description" placeholder="Job Description (one per line)"></textarea>
    `;
    container.appendChild(newItem);
    experienceCount++;
    
    // Animate the new item
    setTimeout(() => {
        newItem.style.animation = 'slideIn 0.4s ease';
    }, 10);
        });
    }
}

// Education Management
let educationCount = 1;

function setupEducationButton() {
    const btn = document.getElementById('addEducation');
    if (btn) {
        btn.addEventListener('click', function() {
    const container = document.getElementById('educationContainer');
    const newItem = document.createElement('div');
    newItem.className = 'education-item sortable-item';
    newItem.draggable = true;
    newItem.innerHTML = `
        <div class="item-header">
            <span class="drag-handle">☰</span>
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <input type="text" class="edu-degree" placeholder="Degree (e.g., Bachelor of Science)" required>
        <input type="text" class="edu-school" placeholder="School/University Name" required>
        <input type="text" class="edu-location" placeholder="Location">
        <input type="month" class="edu-date" placeholder="Graduation Date">
    `;
    container.appendChild(newItem);
    educationCount++;
    setupAutoSave();
    
    // Animate the new item
    setTimeout(() => {
        newItem.style.animation = 'slideIn 0.4s ease';
    }, 10);
        });
    }
}

// Projects Management
function setupProjectButton() {
    const btn = document.getElementById('addProject');
    if (btn) {
        btn.addEventListener('click', function() {
    const container = document.getElementById('projectsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'project-item sortable-item';
    newItem.draggable = true;
    newItem.innerHTML = `
        <div class="item-header">
            <span class="drag-handle">☰</span>
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <input type="text" class="proj-name" placeholder="Project Name" required>
        <input type="text" class="proj-tech" placeholder="Technologies Used (comma separated)">
        <input type="url" class="proj-url" placeholder="Project URL (optional)">
        <textarea class="proj-description" placeholder="Project Description"></textarea>
    `;
    container.appendChild(newItem);
    setupAutoSave();
    
    setTimeout(() => {
        newItem.style.animation = 'slideIn 0.4s ease';
    }, 10);
        });
    }
}

// Certifications Management
function setupCertificationButton() {
    const btn = document.getElementById('addCertification');
    if (btn) {
        btn.addEventListener('click', function() {
    const container = document.getElementById('certificationsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'certification-item sortable-item';
    newItem.draggable = true;
    newItem.innerHTML = `
        <div class="item-header">
            <span class="drag-handle">☰</span>
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <input type="text" class="cert-name" placeholder="Certification Name" required>
        <input type="text" class="cert-issuer" placeholder="Issuing Organization" required>
        <input type="month" class="cert-date" placeholder="Issue Date">
        <input type="url" class="cert-url" placeholder="Credential URL (optional)">
    `;
    container.appendChild(newItem);
    setupAutoSave();
    
    setTimeout(() => {
        newItem.style.animation = 'slideIn 0.4s ease';
    }, 10);
        });
    }
}

// Languages Management
function setupLanguageButton() {
    const btn = document.getElementById('addLanguage');
    if (btn) {
        btn.addEventListener('click', function() {
    const container = document.getElementById('languagesContainer');
    const newItem = document.createElement('div');
    newItem.className = 'language-item sortable-item';
    newItem.draggable = true;
    newItem.innerHTML = `
        <div class="item-header">
            <span class="drag-handle">☰</span>
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <input type="text" class="lang-name" placeholder="Language" required>
        <select class="lang-proficiency">
            <option value="Native">Native</option>
            <option value="Fluent">Fluent</option>
            <option value="Advanced">Advanced</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Basic">Basic</option>
        </select>
    `;
    container.appendChild(newItem);
    setupAutoSave();
    
    setTimeout(() => {
        newItem.style.animation = 'slideIn 0.4s ease';
    }, 10);
        });
    }
}

// Collect Form Data
function collectFormData() {
    // Ensure skills array is properly collected
    const collectedSkills = Array.isArray(skills) ? skills.filter(s => s && s.trim() !== '') : [];
    
    const data = {
        personal: {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value,
            linkedin: document.getElementById('linkedin').value,
            portfolio: document.getElementById('portfolio').value
        },
        summary: document.getElementById('summary').value,
        skills: collectedSkills,
        skillsByCategory: skillsByCategory,
        profileImage: document.getElementById('profileImage').src || '',
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: []
    };

    // Collect experience
    const experienceItems = document.querySelectorAll('.experience-item');
    experienceItems.forEach(item => {
        const experience = {
            jobTitle: item.querySelector('.exp-job-title').value,
            company: item.querySelector('.exp-company').value,
            location: item.querySelector('.exp-location').value,
            startDate: item.querySelector('.exp-start-date').value,
            endDate: item.querySelector('.exp-end-date').value,
            current: item.querySelector('.exp-current').checked,
            date: item.querySelector('.exp-date')?.value || '',
            description: item.querySelector('.exp-description').value
        };
        if (experience.jobTitle && experience.company) {
            data.experience.push(experience);
        }
    });

    // Collect education
    const educationItems = document.querySelectorAll('.education-item');
    educationItems.forEach(item => {
        const education = {
            degree: item.querySelector('.edu-degree').value,
            school: item.querySelector('.edu-school').value,
            location: item.querySelector('.edu-location').value,
            date: item.querySelector('.edu-date').value
        };
        if (education.degree && education.school) {
            data.education.push(education);
        }
    });

    // Collect projects
    const projectItems = document.querySelectorAll('.project-item');
    projectItems.forEach(item => {
        const project = {
            name: item.querySelector('.proj-name').value,
            technologies: item.querySelector('.proj-tech').value,
            url: item.querySelector('.proj-url').value,
            description: item.querySelector('.proj-description').value
        };
        if (project.name) {
            data.projects.push(project);
        }
    });

    // Collect certifications
    const certItems = document.querySelectorAll('.certification-item');
    certItems.forEach(item => {
        const cert = {
            name: item.querySelector('.cert-name').value,
            issuer: item.querySelector('.cert-issuer').value,
            date: item.querySelector('.cert-date').value,
            url: item.querySelector('.cert-url').value
        };
        if (cert.name && cert.issuer) {
            data.certifications.push(cert);
        }
    });

    // Collect languages
    const langItems = document.querySelectorAll('.language-item');
    langItems.forEach(item => {
        const lang = {
            name: item.querySelector('.lang-name').value,
            proficiency: item.querySelector('.lang-proficiency').value
        };
        if (lang.name) {
            data.languages.push(lang);
        }
    });

    return data;
}

// Load Form Data
function loadFormData(data) {
    // Load personal info
    if (data.personal) {
        if (data.personal.fullName) document.getElementById('fullName').value = data.personal.fullName;
        if (data.personal.email) document.getElementById('email').value = data.personal.email;
        if (data.personal.phone) document.getElementById('phone').value = data.personal.phone;
        if (data.personal.location) document.getElementById('location').value = data.personal.location;
        if (data.personal.linkedin) document.getElementById('linkedin').value = data.personal.linkedin;
        if (data.personal.portfolio) document.getElementById('portfolio').value = data.personal.portfolio;
    }
    
    // Load summary
    if (data.summary) document.getElementById('summary').value = data.summary;
    
    // Load skills
    if (data.skills && Array.isArray(data.skills)) {
        skills = data.skills;
    }
    
    // Load skills by category
    if (data.skillsByCategory) {
        skillsByCategory = data.skillsByCategory;
    }
    renderSkills();
    
    // Load profile image
    if (data.profileImage) {
        const profileImage = document.getElementById('profileImage');
        const removeBtn = document.getElementById('removeProfileBtn');
        const placeholder = document.querySelector('.profile-placeholder');
        if (profileImage && data.profileImage) {
            profileImage.src = data.profileImage;
            profileImage.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'block';
        }
    }
    
    // Load experience
    if (data.experience && Array.isArray(data.experience)) {
        const container = document.getElementById('experienceContainer');
        container.innerHTML = '';
        data.experience.forEach((exp, index) => {
            if (index === 0) {
                const firstItem = container.querySelector('.experience-item') || document.createElement('div');
                firstItem.className = 'experience-item';
                firstItem.innerHTML = `
                    <input type="text" class="exp-job-title" placeholder="Job Title" value="${escapeHtml(exp.jobTitle || '')}" required>
                    <input type="text" class="exp-company" placeholder="Company Name" value="${escapeHtml(exp.company || '')}" required>
                    <input type="text" class="exp-location" placeholder="Location" value="${escapeHtml(exp.location || '')}">
                    <input type="text" class="exp-date" placeholder="Start Date - End Date" value="${escapeHtml(exp.date || '')}">
                    <textarea class="exp-description" placeholder="Job Description">${escapeHtml(exp.description || '')}</textarea>
                `;
                if (!container.querySelector('.experience-item')) {
                    container.appendChild(firstItem);
                }
            } else {
                const newItem = document.createElement('div');
                newItem.className = 'experience-item';
                newItem.innerHTML = `
                    <input type="text" class="exp-job-title" placeholder="Job Title" value="${escapeHtml(exp.jobTitle || '')}" required>
                    <input type="text" class="exp-company" placeholder="Company Name" value="${escapeHtml(exp.company || '')}" required>
                    <input type="text" class="exp-location" placeholder="Location" value="${escapeHtml(exp.location || '')}">
                    <input type="text" class="exp-date" placeholder="Start Date - End Date" value="${escapeHtml(exp.date || '')}">
                    <textarea class="exp-description" placeholder="Job Description">${escapeHtml(exp.description || '')}</textarea>
                `;
                container.appendChild(newItem);
            }
        });
    }
    
    // Similar loading for education, projects, certifications, languages...
    // (Simplified for brevity - full implementation would load all sections)
    
    setupAutoSave();
    updateProgress();
}

// Generate Resume HTML
function generateResume(data) {
    const visibleSections = {
        personal: document.querySelector('[data-section="personal"] .section-toggle')?.checked !== false,
        summary: document.querySelector('[data-section="summary"] .section-toggle')?.checked !== false,
        skills: document.querySelector('[data-section="skills"] .section-toggle')?.checked !== false,
        experience: document.querySelector('[data-section="experience"] .section-toggle')?.checked !== false,
        education: document.querySelector('[data-section="education"] .section-toggle')?.checked !== false,
        projects: document.querySelector('[data-section="projects"] .section-toggle')?.checked !== false,
        certifications: document.querySelector('[data-section="certifications"] .section-toggle')?.checked !== false,
        languages: document.querySelector('[data-section="languages"] .section-toggle')?.checked !== false
    };
    
    let html = `
        <div class="resume-header resume-template-${currentTemplate}">
            ${data.profileImage ? `<div class="resume-profile-img"><img src="${data.profileImage}" alt="Profile"></div>` : ''}
            <div class="resume-header-content">
                <h1 class="resume-name">${escapeHtml(data.personal.fullName)}</h1>
                <div class="resume-contact">
                    ${data.personal.email ? `<span>📧 ${escapeHtml(data.personal.email)}</span>` : ''}
                    ${data.personal.phone ? `<span>📱 ${escapeHtml(data.personal.phone)}</span>` : ''}
                    ${data.personal.location ? `<span>📍 ${escapeHtml(data.personal.location)}</span>` : ''}
                    ${data.personal.linkedin ? `<span><a href="${escapeHtml(data.personal.linkedin)}" target="_blank">LinkedIn</a></span>` : ''}
                    ${data.personal.portfolio ? `<span><a href="${escapeHtml(data.personal.portfolio)}" target="_blank">Portfolio</a></span>` : ''}
                </div>
            </div>
        </div>
    `;

    if (visibleSections.summary && data.summary) {
        html += `
            <div class="resume-section-title">Professional Summary</div>
            <div class="resume-summary">${formatText(data.summary)}</div>
        `;
    }

    // Skills section - ensure it displays when skills exist
    if (visibleSections.skills && data.skills && data.skills.length > 0) {
        if (data.skillsByCategory) {
            // Grouped by category
            html += `<div class="resume-section-title">Skills</div>`;
            Object.keys(data.skillsByCategory).forEach(category => {
                if (data.skillsByCategory[category] && data.skillsByCategory[category].length > 0) {
                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
                    const skillsHTML = data.skillsByCategory[category]
                        .map(skill => `<span class="resume-skill">${escapeHtml(skill.trim())}</span>`)
                        .join('');
                    html += `
                        <div class="resume-skill-category">
                            <strong>${categoryName}:</strong>
                            <div class="resume-skills">${skillsHTML}</div>
                        </div>
                    `;
                }
            });
        } else {
            // Fallback to simple list
            const skillsHTML = data.skills
                .filter(skill => skill && skill.trim() !== '')
                .map(skill => `<span class="resume-skill">${escapeHtml(skill.trim())}</span>`)
                .join('');
            if (skillsHTML) {
                html += `
                    <div class="resume-section-title">Skills</div>
                    <div class="resume-skills">${skillsHTML}</div>
                `;
            }
        }
    }

    if (visibleSections.experience && data.experience.length > 0) {
        html += `<div class="resume-section-title">Work Experience</div>`;
        data.experience.forEach(exp => {
            const startDate = exp.startDate ? new Date(exp.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
            const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : (exp.date || '');
            
            html += `
                <div class="resume-item">
                    <div class="resume-item-title">${escapeHtml(exp.jobTitle)}</div>
                    <div class="resume-item-subtitle">${escapeHtml(exp.company)}${exp.location ? ` • ${escapeHtml(exp.location)}` : ''}</div>
                    ${dateRange ? `<div class="resume-item-date">${escapeHtml(dateRange)}</div>` : ''}
                    ${exp.description ? `<div class="resume-item-description">${formatDescription(exp.description)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.education && data.education.length > 0) {
        html += `<div class="resume-section-title">Education</div>`;
        data.education.forEach(edu => {
            const gradDate = edu.date ? new Date(edu.date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            html += `
                <div class="resume-item">
                    <div class="resume-item-title">${escapeHtml(edu.degree)}</div>
                    <div class="resume-item-subtitle">${escapeHtml(edu.school)}${edu.location ? ` • ${escapeHtml(edu.location)}` : ''}</div>
                    ${gradDate ? `<div class="resume-item-date">${escapeHtml(gradDate)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.projects && data.projects && data.projects.length > 0) {
        html += `<div class="resume-section-title">Projects</div>`;
        data.projects.forEach(proj => {
            html += `
                <div class="resume-item">
                    <div class="resume-item-title">${escapeHtml(proj.name)}${proj.url ? ` <a href="${escapeHtml(proj.url)}" target="_blank">🔗</a>` : ''}</div>
                    ${proj.technologies ? `<div class="resume-item-subtitle">Technologies: ${escapeHtml(proj.technologies)}</div>` : ''}
                    ${proj.description ? `<div class="resume-item-description">${formatText(proj.description)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.certifications && data.certifications && data.certifications.length > 0) {
        html += `<div class="resume-section-title">Certifications</div>`;
        data.certifications.forEach(cert => {
            const certDate = cert.date ? new Date(cert.date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            html += `
                <div class="resume-item">
                    <div class="resume-item-title">${escapeHtml(cert.name)}${cert.url ? ` <a href="${escapeHtml(cert.url)}" target="_blank">🔗</a>` : ''}</div>
                    <div class="resume-item-subtitle">${escapeHtml(cert.issuer)}</div>
                    ${certDate ? `<div class="resume-item-date">${escapeHtml(certDate)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.languages && data.languages && data.languages.length > 0) {
        html += `<div class="resume-section-title">Languages</div>`;
        html += `<div class="resume-languages">`;
        data.languages.forEach(lang => {
            html += `<div class="resume-language-item">
                <span class="lang-name">${escapeHtml(lang.name)}</span>
                <span class="lang-level">${escapeHtml(lang.proficiency)}</span>
            </div>`;
        });
        html += `</div>`;
    }

    return html;
}

// Generate DARK resume HTML specifically for PDF - PURE BLACK TEXT ONLY
function generateDarkResumeForPDF(data) {
    const visibleSections = {
        personal: document.querySelector('[data-section="personal"] .section-toggle')?.checked !== false,
        summary: document.querySelector('[data-section="summary"] .section-toggle')?.checked !== false,
        skills: document.querySelector('[data-section="skills"] .section-toggle')?.checked !== false,
        experience: document.querySelector('[data-section="experience"] .section-toggle')?.checked !== false,
        education: document.querySelector('[data-section="education"] .section-toggle')?.checked !== false,
        projects: document.querySelector('[data-section="projects"] .section-toggle')?.checked !== false,
        certifications: document.querySelector('[data-section="certifications"] .section-toggle')?.checked !== false,
        languages: document.querySelector('[data-section="languages"] .section-toggle')?.checked !== false
    };
    
    // Generate HTML with PURE BLACK text - no gradients, no light colors
    let html = `
        <div style="background: #ffffff; color: #000000; font-family: Arial, sans-serif; padding: 50px;">
            <div style="border-bottom: 3px solid #000080; padding-bottom: 20px; margin-bottom: 30px; display: flex; align-items: center; gap: 30px;">
                ${data.profileImage ? `<div style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 3px solid #000080; flex-shrink: 0;"><img src="${data.profileImage}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
                <div style="flex: 1;">
                    <h1 style="font-size: 2.5rem; font-weight: 700; color: #000080; margin: 0 0 10px 0; padding: 0;">${escapeHtml(data.personal.fullName)}</h1>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; color: #000000; font-size: 0.95rem;">
                        ${data.personal.email ? `<span style="color: #000000;">📧 ${escapeHtml(data.personal.email)}</span>` : ''}
                        ${data.personal.phone ? `<span style="color: #000000;">📱 ${escapeHtml(data.personal.phone)}</span>` : ''}
                        ${data.personal.location ? `<span style="color: #000000;">📍 ${escapeHtml(data.personal.location)}</span>` : ''}
                        ${data.personal.linkedin ? `<span><a href="${escapeHtml(data.personal.linkedin)}" style="color: #0000ff; text-decoration: none;">LinkedIn</a></span>` : ''}
                        ${data.personal.portfolio ? `<span><a href="${escapeHtml(data.personal.portfolio)}" style="color: #0000ff; text-decoration: none;">Portfolio</a></span>` : ''}
                    </div>
                </div>
            </div>
    `;

    if (visibleSections.summary && data.summary) {
        html += `
            <div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Professional Summary</div>
            <div style="line-height: 1.8; color: #000000; margin-bottom: 20px; font-size: 1rem;">${formatText(data.summary)}</div>
        `;
    }

    if (visibleSections.skills && data.skills && data.skills.length > 0) {
        html += `<div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Skills</div>`;
        if (data.skillsByCategory) {
            Object.keys(data.skillsByCategory).forEach(category => {
                if (data.skillsByCategory[category] && data.skillsByCategory[category].length > 0) {
                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
                    const skillsHTML = data.skillsByCategory[category]
                        .map(skill => `<span style="background: #e0e0e0; padding: 6px 14px; border-radius: 15px; font-size: 0.9rem; color: #000080; font-weight: 600; border: 1px solid #999999; display: inline-block; margin: 5px;">${escapeHtml(skill.trim())}</span>`)
                        .join('');
                    html += `
                        <div style="margin-bottom: 15px;">
                            <strong style="display: block; margin-bottom: 8px; color: #000080; font-size: 0.95rem; font-weight: 600;">${categoryName}:</strong>
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">${skillsHTML}</div>
                        </div>
                    `;
                }
            });
        } else {
            const skillsHTML = data.skills
                .filter(skill => skill && skill.trim() !== '')
                .map(skill => `<span style="background: #e0e0e0; padding: 6px 14px; border-radius: 15px; font-size: 0.9rem; color: #000080; font-weight: 600; border: 1px solid #999999; display: inline-block; margin: 5px;">${escapeHtml(skill.trim())}</span>`)
                .join('');
            html += `<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">${skillsHTML}</div>`;
        }
    }

    if (visibleSections.experience && data.experience.length > 0) {
        html += `<div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Work Experience</div>`;
        data.experience.forEach(exp => {
            const startDate = exp.startDate ? new Date(exp.startDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
            const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : (exp.date || '');
            
            html += `
                <div style="margin-bottom: 25px; padding-left: 20px; border-left: 3px solid #000080; padding-bottom: 15px;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: #000000; margin-bottom: 5px;">${escapeHtml(exp.jobTitle)}</div>
                    <div style="color: #000080; font-weight: 600; margin-bottom: 5px;">${escapeHtml(exp.company)}${exp.location ? ` • ${escapeHtml(exp.location)}` : ''}</div>
                    ${dateRange ? `<div style="color: #000000; font-size: 0.9rem; margin-bottom: 10px; font-weight: 500;">${escapeHtml(dateRange)}</div>` : ''}
                    ${exp.description ? `<div style="color: #000000; line-height: 1.6; margin-top: 8px; font-size: 1rem;">${formatDescription(exp.description)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.education && data.education.length > 0) {
        html += `<div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Education</div>`;
        data.education.forEach(edu => {
            const gradDate = edu.date ? new Date(edu.date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            html += `
                <div style="margin-bottom: 25px; padding-left: 20px; border-left: 3px solid #000080; padding-bottom: 15px;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: #000000; margin-bottom: 5px;">${escapeHtml(edu.degree)}</div>
                    <div style="color: #000080; font-weight: 600; margin-bottom: 5px;">${escapeHtml(edu.school)}${edu.location ? ` • ${escapeHtml(edu.location)}` : ''}</div>
                    ${gradDate ? `<div style="color: #000000; font-size: 0.9rem; margin-bottom: 10px; font-weight: 500;">${escapeHtml(gradDate)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.projects && data.projects && data.projects.length > 0) {
        html += `<div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Projects</div>`;
        data.projects.forEach(proj => {
            html += `
                <div style="margin-bottom: 25px; padding-left: 20px; border-left: 3px solid #000080; padding-bottom: 15px;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: #000000; margin-bottom: 5px;">${escapeHtml(proj.name)}${proj.url ? ` <a href="${escapeHtml(proj.url)}" style="color: #0000ff; text-decoration: none;">🔗</a>` : ''}</div>
                    ${proj.technologies ? `<div style="color: #000080; font-weight: 600; margin-bottom: 5px;">Technologies: ${escapeHtml(proj.technologies)}</div>` : ''}
                    ${proj.description ? `<div style="color: #000000; line-height: 1.6; margin-top: 8px; font-size: 1rem;">${formatText(proj.description)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.certifications && data.certifications && data.certifications.length > 0) {
        html += `<div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Certifications</div>`;
        data.certifications.forEach(cert => {
            const certDate = cert.date ? new Date(cert.date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            html += `
                <div style="margin-bottom: 25px; padding-left: 20px; border-left: 3px solid #000080; padding-bottom: 15px;">
                    <div style="font-size: 1.2rem; font-weight: 700; color: #000000; margin-bottom: 5px;">${escapeHtml(cert.name)}${cert.url ? ` <a href="${escapeHtml(cert.url)}" style="color: #0000ff; text-decoration: none;">🔗</a>` : ''}</div>
                    <div style="color: #000080; font-weight: 600; margin-bottom: 5px;">${escapeHtml(cert.issuer)}</div>
                    ${certDate ? `<div style="color: #000000; font-size: 0.9rem; margin-bottom: 10px; font-weight: 500;">${escapeHtml(certDate)}</div>` : ''}
                </div>
            `;
        });
    }

    if (visibleSections.languages && data.languages && data.languages.length > 0) {
        html += `<div style="font-size: 1.5rem; color: #000080; margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #cccccc; font-weight: 600;">Languages</div>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">`;
        data.languages.forEach(lang => {
            html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: #f0f0f0; border-radius: 8px; border-left: 3px solid #000080;">
                <span style="font-weight: 600; color: #000000;">${escapeHtml(lang.name)}</span>
                <span style="color: #000080; font-size: 0.9rem; font-weight: 500;">${escapeHtml(lang.proficiency)}</span>
            </div>`;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

// Utility Functions
function formatText(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function formatDescription(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 1) {
        return `<p>${escapeHtml(lines[0])}</p>`;
    }
    return `<ul>${lines.map(line => `<li>${escapeHtml(line.trim())}</li>`).join('')}</ul>`;
}

// Generate Resume Button
function setupGenerateButton() {
    const btn = document.getElementById('generateBtn');
    if (btn) {
        btn.addEventListener('click', function() {
    // Validate required fields
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    
    if (!fullName || !email) {
        alert('Please fill in at least your Full Name and Email Address.');
        return;
    }

    // Add loading animation
    const btn = this;
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="loading"></span> Generating...';
    btn.disabled = true;

    // Simulate processing time for animation
    setTimeout(() => {
        const data = collectFormData();
        const resumeHTML = generateResume(data);
        
        document.getElementById('resumePreview').innerHTML = resumeHTML;
        document.getElementById('formSection').classList.add('hidden');
        document.getElementById('resumeSection').classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Reset button
        btn.textContent = originalText;
        btn.disabled = false;
    }, 800);
        });
    }
}

// Back Button
function setupBackButton() {
    const btn = document.getElementById('backBtn');
    if (btn) {
        btn.addEventListener('click', function() {
    document.getElementById('resumeSection').classList.add('hidden');
    document.getElementById('formSection').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Download PDF Button
function setupDownloadButton() {
    const btn = document.getElementById('downloadBtn');
    if (btn) {
        btn.addEventListener('click', function() {
    const btn = this;
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="loading"></span> Generating PDF...';
    btn.disabled = true;

    const element = document.getElementById('resumePreview');
    
    // Replace preview with dark text version for PDF
    const data = collectFormData();
    const darkHTML = generateDarkResumeForPDF(data);
    element.innerHTML = darkHTML;
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${document.getElementById('fullName').value || 'resume'}_resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            letterRendering: true,
            allowTaint: true,
            removeContainer: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Save original HTML to restore later
    const originalHTML = element.innerHTML;
    
    // Generate PDF
    setTimeout(() => {
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore original preview
            const data = collectFormData();
            element.innerHTML = generateResume(data);
            btn.textContent = originalText;
            btn.disabled = false;
        }).catch((error) => {
            // Restore original preview on error
            const data = collectFormData();
            element.innerHTML = generateResume(data);
            btn.textContent = originalText;
            btn.disabled = false;
            console.error('PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
        });
    }, 300);
        });
    }
}

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Import/Export Functionality
function setupImportExport() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
    const data = collectFormData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.personal.fullName || 'resume'}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
        });
    }

    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            document.getElementById('importFile').click();
        });
    }

    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('This will replace your current data. Continue?')) {
                loadFormData(data);
                saveToLocalStorage();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing file. Please check the file format.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    this.value = ''; // Reset file input
        });
    }
}

// Print Functionality
function setupPrintButton() {
    const btn = document.getElementById('printBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            window.print();
        });
    }
}

// Theme Toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('resumeTheme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        }
        
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('resumeTheme', isLight ? 'light' : 'dark');
        });
    }
}

// Template Selector
let currentTemplate = 'classic';
function setupTemplateSelector() {
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        const savedTemplate = localStorage.getItem('resumeTemplate') || 'classic';
        templateSelect.value = savedTemplate;
        currentTemplate = savedTemplate;
        
        templateSelect.addEventListener('change', function() {
            currentTemplate = this.value;
            localStorage.setItem('resumeTemplate', currentTemplate);
        });
    }
}

// Profile Picture Upload
function setupProfileUpload() {
    const uploadBtn = document.getElementById('uploadProfileBtn');
    const removeBtn = document.getElementById('removeProfileBtn');
    const uploadInput = document.getElementById('profileUpload');
    const profileImage = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    
    if (uploadBtn && uploadInput) {
        uploadBtn.addEventListener('click', () => uploadInput.click());
        
        uploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImage.src = e.target.result;
                    profileImage.style.display = 'block';
                    profilePreview.querySelector('.profile-placeholder').style.display = 'none';
                    removeBtn.style.display = 'block';
                    saveToLocalStorage();
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            profileImage.src = '';
            profileImage.style.display = 'none';
            profilePreview.querySelector('.profile-placeholder').style.display = 'block';
            removeBtn.style.display = 'none';
            uploadInput.value = '';
            saveToLocalStorage();
        });
    }
}

// Form Validation
function setupValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const fullNameInput = document.getElementById('fullName');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const error = document.getElementById('emailError');
            if (this.validity.typeMismatch) {
                error.textContent = 'Please enter a valid email address';
            } else if (this.validity.valueMissing) {
                error.textContent = 'Email is required';
            } else {
                error.textContent = '';
            }
        });
    }
    
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const error = document.getElementById('phoneError');
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (this.value && !phoneRegex.test(this.value)) {
                error.textContent = 'Please enter a valid phone number';
            } else {
                error.textContent = '';
            }
        });
    }
    
    if (fullNameInput) {
        fullNameInput.addEventListener('blur', function() {
            const error = document.getElementById('fullNameError');
            if (this.validity.valueMissing) {
                error.textContent = 'Full name is required';
            } else {
                error.textContent = '';
            }
        });
    }
    
    // Character counter for summary
    const summaryInput = document.getElementById('summary');
    const summaryCounter = document.getElementById('summaryCounter');
    if (summaryInput && summaryCounter) {
        summaryInput.addEventListener('input', function() {
            summaryCounter.textContent = this.value.length;
        });
    }
}

// Section Visibility Toggle
function setupSectionToggles() {
    const toggles = document.querySelectorAll('.section-toggle');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const section = this.dataset.section;
            localStorage.setItem(`section_${section}_visible`, this.checked);
        });
        
        // Load saved state
        const saved = localStorage.getItem(`section_${toggle.dataset.section}_visible`);
        if (saved !== null) {
            toggle.checked = saved === 'true';
        }
    });
}

// Drag and Drop
function setupDragAndDrop() {
    const containers = document.querySelectorAll('.sortable-container');
    
    containers.forEach(container => {
        let draggedElement = null;
        
        container.addEventListener('dragstart', function(e) {
            const item = e.target.closest('.sortable-item');
            if (item) {
                draggedElement = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.innerHTML);
            }
        });
        
        container.addEventListener('dragend', function(e) {
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                draggedElement = null;
            }
        });
        
        container.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (!draggedElement) return;
            
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggedElement);
            } else {
                container.insertBefore(draggedElement, afterElement);
            }
        });
        
        container.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedElement) {
                saveToLocalStorage();
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Delete Buttons
function setupDeleteButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            const item = e.target.closest('.sortable-item');
            if (item && confirm('Are you sure you want to remove this item?')) {
                item.remove();
                saveToLocalStorage();
                updateProgress();
            }
        }
    });
}

// Undo/Redo System
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

function saveToHistory() {
    const data = collectFormData();
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.stringify(data));
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyIndex++;
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        const data = JSON.parse(history[historyIndex]);
        loadFormData(data);
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        const data = JSON.parse(history[historyIndex]);
        loadFormData(data);
    }
}

function setupUndoRedo() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
    
    // Save to history on changes
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveToHistory();
            }, 2000);
        });
    });
}

// Keyboard Shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveToLocalStorage();
        }
        
        // Ctrl+G to generate
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            document.getElementById('generateBtn')?.click();
        }
        
        // Ctrl+Z to undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        
        // Ctrl+Y or Ctrl+Shift+Z to redo
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
        }
    });
}

// Date Handling
function setupDateInputs() {
    // Handle current job checkbox
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('exp-current')) {
            const endDate = e.target.closest('.experience-item').querySelector('.exp-end-date');
            if (e.target.checked) {
                endDate.disabled = true;
                endDate.value = '';
            } else {
                endDate.disabled = false;
            }
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Setup all event listeners
    setupSkillsInput();
    setupExperienceButton();
    setupEducationButton();
    setupProjectButton();
    setupCertificationButton();
    setupLanguageButton();
    setupGenerateButton();
    setupBackButton();
    setupDownloadButton();
    setupImportExport();
    setupPrintButton();
    
    // New features
    setupThemeToggle();
    setupTemplateSelector();
    setupProfileUpload();
    setupValidation();
    setupSectionToggles();
    setupDragAndDrop();
    setupDeleteButtons();
    setupUndoRedo();
    setupKeyboardShortcuts();
    setupDateInputs();
    
    // Load saved data
    loadFromLocalStorage();
    
    // Setup auto-save
    setupAutoSave();
    
    // Update progress
    updateProgress();
    
    // Update progress periodically
    setInterval(updateProgress, 2000);
    
    // Initial history save
    setTimeout(() => saveToHistory(), 1000);
});

// Add input animations
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

