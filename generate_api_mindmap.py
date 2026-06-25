#!/usr/bin/env python3
"""
Generate API Mind Map Image for HRMS Backend
This script creates a visual mind map of all backend API endpoints
"""

from graphviz import Digraph
import os

def create_api_mindmap():
    """Create a visual mind map of the HRMS Backend API"""
    
    # Create a new directed graph
    dot = Digraph(comment='HRMS Backend API Mind Map',
                  format='png',
                  engine='dot',
                  graph_attr={
                      'rankdir': 'LR',
                      'size': '20,15',
                      'dpi': '300',
                      'bgcolor': '#f8f9fa',
                      'fontname': 'Arial',
                      'fontsize': '16'
                  },
                  node_attr={
                      'fontname': 'Arial',
                      'fontsize': '12',
                      'shape': 'box',
                      'style': 'rounded,filled',
                      'fillcolor': '#e3f2fd',
                      'color': '#1565c0',
                      'penwidth': '2'
                  },
                  edge_attr={
                      'fontname': 'Arial',
                      'fontsize': '10',
                      'color': '#546e7a'
                  })
    
    # Main root node
    dot.node('API', 'HRMS Backend API\n/api/v1', 
             shape='ellipse', 
             fillcolor='#1565c0', 
             fontcolor='white',
             fontsize='16',
             width='2.5')
    
    # Define main API categories with their endpoints
    api_categories = {
        'Authentication': {
            'color': '#ff6b6b',
            'endpoints': [
                'POST /register',
                'POST /login',
                'POST /logout',
                'POST /refresh-token',
                'POST /verify-email',
                'POST /forgot-password',
                'POST /reset-password'
            ]
        },
        'Employees': {
            'color': '#4ecdc4',
            'endpoints': [
                'GET /',
                'GET /:id',
                'POST /',
                'PUT /:id',
                'DELETE /:id',
                'GET /department/:id',
                'GET /shift/:id'
            ]
        },
        'Departments': {
            'color': '#45b7d1',
            'endpoints': [
                'GET /',
                'GET /:id',
                'POST /',
                'PUT /:id',
                'DELETE /:id'
            ]
        },
        'Shifts': {
            'color': '#96ceb4',
            'endpoints': [
                'GET /',
                'GET /:id',
                'POST /',
                'PUT /:id',
                'DELETE /:id'
            ]
        },
        'Attendance': {
            'color': '#ffeaa7',
            'endpoints': [
                'POST /punch-in',
                'POST /punch-out',
                'GET /today/:id',
                'GET /employee/:id',
                'GET /all-employees',
                'POST /check-in',
                'POST /check-out',
                'GET /my-today',
                'GET /my-range'
            ]
        },
        'Leaves': {
            'color': '#dfe6e9',
            'endpoints': [
                'GET /',
                'GET /my-requests',
                'POST /',
                'PUT /:id',
                'PUT /:id/approve',
                'PUT /:id/reject',
                'GET /balance/:id',
                'GET /holidays',
                'GET /types'
            ]
        },
        'Performance': {
            'color': '#fd79a8',
            'endpoints': [
                'GET /',
                'GET /:id',
                'GET /employee/:id',
                'POST /',
                'PUT /:id',
                'GET /summary',
                'GET /analytics'
            ]
        },
        'Payroll': {
            'color': '#a29bfe',
            'endpoints': [
                'GET /',
                'POST /process',
                'POST /approve',
                'GET /report',
                'GET /payslip',
                'GET /export'
            ]
        },
        'Companies': {
            'color': '#6c5ce7',
            'endpoints': [
                'GET /',
                'GET /stats',
                'POST /',
                'PUT /:id',
                'PATCH /:id/status',
                'DELETE /:id'
            ]
        },
        'Biometric': {
            'color': '#00b894',
            'endpoints': [
                'POST /devices',
                'GET /devices',
                'POST /devices/:id/connect',
                'POST /devices/:id/sync',
                'POST /sync-all'
            ]
        },
        'Mobile': {
            'color': '#e17055',
            'endpoints': [
                'POST /register-device',
                'POST /verify-location',
                'POST /check-in-with-location',
                'GET /dashboard/employee/:id',
                'GET /attendance/today-status/:id',
                'GET /leave/balance/:id'
            ]
        },
        'Recruitment': {
            'color': '#fdcb6e',
            'endpoints': [
                'GET /jobs',
                'POST /jobs',
                'GET /candidates',
                'POST /candidates',
                'GET /interviews',
                'POST /interviews'
            ]
        },
        'Assets': {
            'color': '#74b9ff',
            'endpoints': [
                'GET /',
                'POST /',
                'PUT /:id',
                'DELETE /:id',
                'POST /:id/assign'
            ]
        },
        'Reports': {
            'color': '#55efc4',
            'endpoints': [
                'GET /attendance',
                'GET /leave',
                'GET /performance'
            ]
        }
    }
    
    # Create nodes and edges for each category
    for category, data in api_categories.items():
        category_id = category.replace(' ', '_').replace('/', '_')
        
        # Category node
        dot.node(category_id, 
                f'{category}\n/api/{category.lower()}',
                fillcolor=data['color'],
                fontcolor='white' if data['color'] in ['#ff6b6b', '#6c5ce7', '#00b894', '#1565c0'] else 'black')
        
        # Edge from root to category
        dot.edge('API', category_id)
        
        # Create endpoint nodes
        for i, endpoint in enumerate(data['endpoints'][:5]):  # Limit to 5 endpoints per category for readability
            endpoint_id = f'{category_id}_ep{i}'
            dot.node(endpoint_id, 
                    endpoint,
                    fillcolor='#ffffff',
                    fontsize='10',
                    shape='box')
            dot.edge(category_id, endpoint_id)
        
        # Add note if there are more endpoints
        if len(data['endpoints']) > 5:
            more_id = f'{category_id}_more'
            dot.node(more_id, 
                    f'+{len(data["endpoints"]) - 5} more...',
                    fillcolor='#f8f9fa',
                    fontsize='9',
                    shape='ellipse')
            dot.edge(category_id, more_id)
    
    # Add additional categories note
    dot.node('More', '+ Additional APIs:\n- KPIs\n- Notifications\n- Users/Roles\n- Access Control\n- Support\n- Onboarding/Offboarding\n- Loans/Reimbursements',
            fillcolor='#ffeaa7',
            fontsize='10')
    dot.edge('API', 'More')
    
    return dot

def main():
    """Main function to generate the mind map"""
    print("Generating HRMS Backend API Mind Map...")
    
    try:
        # Create the mind map
        dot = create_api_mindmap()
        
        # Save the file
        output_file = 'HRMS_API_MindMap'
        dot.render(output_file, cleanup=False)
        
        print(f"✅ Mind map generated successfully: {output_file}.png")
        print(f"📄 Source file saved: {output_file}.gv")
        
        # Also create a hierarchical tree version
        dot_tree = create_hierarchical_tree()
        tree_file = 'HRMS_API_Tree'
        dot_tree.render(tree_file, cleanup=False)
        print(f"✅ Hierarchical tree generated: {tree_file}.png")
        
    except Exception as e:
        print(f"❌ Error generating mind map: {str(e)}")
        print("💡 Make sure you have graphviz installed:")
        print("   - Mac: brew install graphviz")
        print("   - Ubuntu: sudo apt-get install graphviz")
        print("   - Python: pip install graphviz")

def create_hierarchical_tree():
    """Create a hierarchical tree view of the API structure"""
    dot = Digraph(comment='HRMS API Hierarchy',
                  format='png',
                  engine='dot',
                  graph_attr={
                      'rankdir': 'TB',
                      'size': '12,20',
                      'dpi': '300',
                      'bgcolor': '#ffffff',
                      'fontname': 'Arial'
                  },
                  node_attr={
                      'fontname': 'Arial',
                      'fontsize': '11',
                      'shape': 'rectangle',
                      'style': 'filled',
                      'fillcolor': '#e8f4f8'
                  })
    
    # Root
    dot.node('root', 'HRMS API\n/api/v1', fillcolor='#1565c0', fontcolor='white')
    
    # Main branches
    branches = {
        'Auth': ['Authentication', '/auth'],
        'Emp': ['Employee Mgmt', '/employees'],
        'Att': ['Attendance', '/attendance'],
        'Leave': ['Leave Mgmt', '/leaves'],
        'Pay': ['Payroll', '/payroll'],
        'Comp': ['Companies', '/companies'],
        'Bio': ['Biometric', '/biometric'],
        'Mob': ['Mobile', '/mobile'],
        'Rec': ['Recruitment', '/recruitment'],
        'Asset': ['Assets', '/assets']
    }
    
    for branch_id, (name, path) in branches.items():
        dot.node(branch_id, f'{name}\n{path}', fillcolor='#4a90a4')
        dot.edge('root', branch_id)
    
    return dot

if __name__ == '__main__':
    main()
