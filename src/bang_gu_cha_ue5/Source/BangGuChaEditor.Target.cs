using UnrealBuildTool;
using System.Collections.Generic;

public class BangGuChaEditorTarget : TargetRules
{
	public BangGuChaEditorTarget( TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		ExtraModuleNames.AddRange( new string[] { "BangGuCha" } );
	}
}
