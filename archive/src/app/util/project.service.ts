import { Injectable } from '@angular/core';
import { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private projects: Project[] = [
        {
            id: '1',
            title: 'Portfolio Website',
            categories: ['Web'],
            tags: ['Angular', 'SCSS'],
            route: '/project/1'
        },
        {
            id: '2',
            title: 'Game Engine',
            categories: ['Games'],
            tags: ['C++', 'OpenGL'],
            route: '/project/2'
        },
        {
            id: '3',
            title: 'Mobile App',
            categories: ['Mobile'],
            tags: ['Flutter', 'Dart'],
            route: '/project/3'
        },
        {
            id: '4',
            title: 'API Gateway Service',
            categories: ['Backend'],
            tags: ['Node.js', 'REST'],
            route: '/project/4'
        },
        {
            id: '5',
            title: 'Data Visualizer',
            categories: ['Web', 'Data'],
            tags: ['D3.js', 'TypeScript'],
            route: '/project/5'
        },
        {
            id: '6',
            title: 'CLI Toolchain',
            categories: ['Tools'],
            tags: ['Rust', 'CLI'],
            route: '/project/6'
        },
        {
            id: '7',
            title: 'Design System',
            categories: ['Web'],
            tags: ['CSS', 'Figma'],
            route: '/project/7'
        },
        {
            id: '8',
            title: 'ML Pipeline',
            categories: ['Data'],
            tags: ['Python', 'TensorFlow'],
            route: '/project/8'
        },
    ];

    getAll(): Project[] {
        return this.projects;
    }

    getCategories(): string[] {
        const cats = new Set<string>();
        this.projects.forEach(p => p.categories?.forEach(c => cats.add(c)));
        return Array.from(cats).sort();
    }
}
