import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { filter, startWith } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

interface BreadcrumbItem {
  label: string;
  url: string;
  isLast: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public breadcrumbs: BreadcrumbItem[] = [];

  ngOnInit(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null)
    ).subscribe(() => {
      const built = this.createBreadcrumbs(this.activatedRoute.root);
      
      if (built.length > 0) {
        built[built.length - 1].isLast = true;
      }
      
      this.breadcrumbs = built;
    });
  }

  private createBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: BreadcrumbItem[] = []
  ): BreadcrumbItem[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      if (child.outlet !== 'primary') {
        continue;
      }

      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      let nextUrl = url;
      if (routeURL !== '') {
        nextUrl += `/${routeURL}`;
      }

      let label = child.snapshot.data['breadcrumb'];
      
      if (label === 'SKIP') {
        return this.createBreadcrumbs(child, nextUrl, breadcrumbs);
      }
      
      if (!label) {
        label = child.snapshot.title;
      }

      if (!label && routeURL) {
        label = routeURL.charAt(0).toUpperCase() + routeURL.slice(1);
      }

      if (label) {
        const suffixIndex = label.indexOf(' - ');
        if (suffixIndex !== -1) {
          label = label.substring(0, suffixIndex);
        }

        const existing = breadcrumbs.find(b => b.url === nextUrl);
        if (!existing) {
          breadcrumbs.push({
            label: label,
            url: nextUrl,
            isLast: false,
          });
        }
      }

      return this.createBreadcrumbs(child, nextUrl, breadcrumbs);
    }

    return breadcrumbs;
  }
}
