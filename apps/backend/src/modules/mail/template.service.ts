import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';

interface TemplateVars {
  [key: string]: any;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private handlebars: typeof Handlebars;
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.handlebars = Handlebars.create();
  }

  async renderTemplate(name: string, vars: TemplateVars): Promise<string> {
    if (
      !this.handlebars.partials ||
      Object.keys(this.handlebars.partials).length === 0
    ) {
      await this.registerPartials();
    }
    // Check if this is a layout-based template
    if (name.includes('.html'))
      return this.renderHTML(name.replace('.html', ''), vars);
    // For text templates, render directly from content directory
    const templatePath = `content/${name}.template.txt`;
    const template = await this.getCompliedTemplate(templatePath);
    return template(vars);
  }

  private async renderHTML(name: string, vars: TemplateVars): Promise<string> {
    const templatePath = `content/${name}.template.html`;
    const contentTemplate = await this.getCompliedTemplate(templatePath);
    const content = contentTemplate(vars);
    // Load the base layout and render with content
    const layout = await this.getCompliedTemplate('layouts/base.template.html');
    const layoutVariables = { ...vars, content };
    return layout(layoutVariables);
  }

  private async getCompliedTemplate(
    name: string,
  ): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(name)) return this.templateCache.get(name)!;
    try {
      const templateContent = await this.loadTemplateFile(name);
      const compiledTemplate = this.handlebars.compile(templateContent);
      this.templateCache.set(name, compiledTemplate);
      this.logger.debug(`Template compiled and cached: ${name}`);
      return compiledTemplate;
    } catch (error) {
      this.logger.error(`Failed to compile template ${name}:`, error);
      throw new Error(`Failed to compile template ${name}: ${error.message}`);
    }
  }

  // Load template file from filesystem
  private async loadTemplateFile(templateName: string): Promise<string> {
    // In dev: __dirname is src/modules/mail
    // In prod: __dirname is dist/modules/mail (templates are copied there by
    // nest-cli.json assets config)
    const templatePath = join(__dirname, 'templates', templateName);
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      this.logger.debug(`Template loaded from: ${templatePath}`);
      return content;
    } catch (err) {
      throw new Error(
        `Template file not found: ${templateName} at ${templatePath}.
        Ensure nest-cli.json includes templates in assets.`,
      );
    }
  }

  // Register partials from the partials directory
  private async registerPartials(): Promise<void> {
    const partialsDir = join(__dirname, 'templates', 'partials');
    try {
      const files = await fs.readdir(partialsDir);
      for (const file of files) {
        if (file.endsWith('.template.html')) {
          const partialName = file.replace('.template.html', '');
          const partialPath = join(partialsDir, file);
          const partialContent = await fs.readFile(partialPath, 'utf-8');
          this.handlebars.registerPartial(partialName, partialContent);
          this.logger.debug(`Registered partial: ${partialName}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not load partials: ${error.message}`);
    }
  }
}
