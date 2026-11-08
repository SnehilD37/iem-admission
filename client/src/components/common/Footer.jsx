import React from 'react';
import { GraduationCap, ShieldCheck, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--secondary)', color: '#94A3B8', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container" style={{ padding: '3.5rem 1.5rem 2rem' }}>
        <div className="grid grid-cols-4 md-col-1 gap-8" style={{ marginBottom: '2.5rem' }}>
          
          {/* Col 1: Institute Overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/logo.png" 
                alt="IEM Logo" 
                style={{ 
                  height: '58px', 
                  width: 'auto', 
                  objectFit: 'contain', 
                  display: 'block' 
                }} 
              />
              <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.15rem' }}>
                IEM
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', lineHeight: 1.6, color: '#94A3B8' }}>
              Institute of Engineering & Management (IEM), Kolkata. Premier autonomous engineering college affiliated to Maulana Abul Kalam Azad University of Technology (MAKAUT).
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1' }}>NAAC 'A' Grade</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1' }}>NBA Accredited</span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#CBD5E1' }}>NIRF Ranked</span>
            </div>
          </div>

          {/* Col 2: Engineering Programs */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
              B.Tech Departments
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <li>Computer Science & Engineering (CSE)</li>
              <li>CSE (Artificial Intelligence & ML)</li>
              <li>Information Technology (IT)</li>
              <li>Computer Science & Business Systems (CSBS)</li>
              <li>Electronics & Communication Engg. (ECE)</li>
            </ul>
          </div>

          {/* Col 3: Campus & Contact */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
              Admission Cell & Campus
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
              <li style={{ display: 'flex', gap: '8px' }}>
                <MapPin size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Sector V, Salt Lake Electronics Complex, Kolkata, West Bengal 700091</span>
              </li>
              <li style={{ display: 'flex', gap: '8px' }}>
                <Phone size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                <span>+91 33 2357 2059 / 2995</span>
              </li>
              <li style={{ display: 'flex', gap: '8px' }}>
                <Mail size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                <span>admissions@iem.edu.in</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Academic Credits */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
              Project Architecture
            </h4>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '0.775rem', lineHeight: 1.5 }}>
              <div style={{ color: '#FFFFFF', fontWeight: 600, marginBottom: '4px' }}>
                DevForge (Team P4)
              </div>
              <p>Course: PCCCS504 (SE & Project Management)</p>
              <p>Supervisor: Prof. S. Dutta & Prof. P. Chakraborty</p>
              <div style={{ marginTop: '8px', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Academic Session 2027–2028</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem' }}>
          <div>
            © 2027 Institute of Engineering & Management (IEM). All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Admission</span>
            <span>Anti-Ragging Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
