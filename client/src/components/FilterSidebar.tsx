import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export interface FilterOptions {
  roles: string[];
  skills: string[];
  availability: string[];
}

interface FilterSidebarProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const toggleRole = (role: string) => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter(r => r !== role)
      : [...filters.roles, role];
    onChange({ ...filters, roles: newRoles });
  };

  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    onChange({ ...filters, skills: newSkills });
  };

  const clearFilters = () => {
    onChange({ roles: [], skills: [], availability: [] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          data-testid="button-clear-filters"
        >
          Clear
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Role Type</Label>
          <div className="space-y-2">
            {["Vibe Coder", "Investor", "Tech Lead"].map((role) => (
              <div key={role} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={filters.roles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                  data-testid={`checkbox-role-${role.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label 
                  htmlFor={`role-${role}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {role}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Skills</Label>
          <div className="space-y-2">
            {["React", "Node.js", "Python", "AI/ML", "Blockchain"].map((skill) => (
              <div key={skill} className="flex items-center gap-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={filters.skills.includes(skill)}
                  onCheckedChange={() => toggleSkill(skill)}
                  data-testid={`checkbox-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                />
                <Label 
                  htmlFor={`skill-${skill}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {skill}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
