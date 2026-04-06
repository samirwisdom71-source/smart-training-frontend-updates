import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ImpactPageComponent } from './impact-page.component';
import { ImpactApiService } from '../../../core/api/impact/impact-api.service';

describe('ImpactPageComponent', () => {
  let component: ImpactPageComponent;
  let fixture: ComponentFixture<ImpactPageComponent>;
  let apiService: jasmine.SpyObj<ImpactApiService>;

  beforeEach(async () => {
    apiService = jasmine.createSpyObj('ImpactApiService', ['getSummary', 'getPaged']);
    apiService.getSummary.and.returnValue(of({ success: true, data: { totalRecords: 10, averageProductivityScore: 80, averagePerformanceImprovement: 15 } }));
    apiService.getPaged.and.returnValue(of({
        success: true,
        data: {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }));

    await TestBed.configureTestingModule({
      imports: [ImpactPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ImpactApiService, useValue: apiService },
        provideRouter([]),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');

    fixture = TestBed.createComponent(ImpactPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getSummary and getPaged on load', () => {
    expect(apiService.getSummary).toHaveBeenCalled();
    expect(apiService.getPaged).toHaveBeenCalled();
  });

  it('should set summary when getSummary returns data', () => {
    expect(component.summary()).not.toBeNull();
    expect(component.summary()?.totalRecords).toBe(10);
  });
});
